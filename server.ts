import express, { Request, Response } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminLogoutAll,
  handleAdminSessionStatus,
  initAdminSessionVersion,
  isAdminPasswordConfigured,
} from './server/adminAuth';
import fs from 'fs';
import {
  onPublicContentMutated,
  rateLimitMiddleware,
  registerAdminAndPublicRoutes,
} from './server/adminRoutes';
import {
  generateDynamicSitemapXml,
  generateRobotsTxt,
  injectSsrHtml,
  invalidateSeoCache,
  resolveRouteSeo,
} from './server/seoSsr';
import {
  isFirebaseAdminConfigured,
  pingFirestoreAdmin,
  verifyFirebaseAdminOnStartup,
} from './server/firebaseAdmin';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ChatRequestSchema = z.object({
  model: z.string().trim().max(80).optional(),
  messages: z
    .array(
      z.object({
        role: z.string().max(20).optional(),
        content: z.string().max(4000).optional(),
        text: z.string().max(4000).optional(),
      })
    )
    .min(1)
    .max(30),
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.set('trust proxy', 1);

  const isProd = process.env.NODE_ENV === 'production';
  const appUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');

  app.use(compression({ threshold: 1024 }));
  app.use(express.json({ limit: '5mb' }));

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (appUrl && origin === appUrl) return callback(null, true);
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.endsWith('.run.app')
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      xFrameOptions: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://maps.googleapis.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://storage.googleapis.com',
            'https://firebasestorage.googleapis.com',
            'https://*.googleusercontent.com',
            'https://maps.gstatic.com',
            'https://maps.googleapis.com',
          ],
          mediaSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://storage.googleapis.com',
            'https://firebasestorage.googleapis.com',
          ],
          connectSrc: [
            "'self'",
            'https://*.googleapis.com',
            'https://*.firebaseio.com',
            'https://*.firebaseapp.com',
            'https://*.firebasestorage.app',
            'https://identitytoolkit.googleapis.com',
            'https://securetoken.googleapis.com',
            'wss:',
            'ws:',
          ],
          frameSrc: ["'self'"],
          frameAncestors: ["'self'", 'https://aistudio.google.com', 'https://*.google.com'],
          upgradeInsecureRequests: isProd ? [] : null,
        },
      },
    })
  );

  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) return next();
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          method: req.method,
          path: req.path,
          status: res.statusCode,
          ms,
        })
      );
    });
    next();
  });

  // Telemetry requirement: User-Agent set to 'aistudio-build'
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const DEFAULT_ALLOWED_MODELS = [
    'gemini-4-hydrogen',
    'gemini-3.1-flash-lite',
    'gemini-4-carbon',
    'gemini-4-argon',
  ];
  const MODEL_ALIASES: Record<string, string> = {
    'gemini-3.8-flash': 'gemini-4-hydrogen',
  };
  const ALLOWED_MODELS = (process.env.GEMINI_MODELS || '')
    .split(',')
    .map((m) => {
      const trimmed = m.trim();
      return MODEL_ALIASES[trimmed] || trimmed;
    })
    .filter(Boolean);
  const SUPPORTED_MODELS = Array.from(
    new Set(
      ALLOWED_MODELS.length > 0
        ? [...ALLOWED_MODELS, 'gemini-4-hydrogen', 'gemini-3.1-flash-lite']
        : DEFAULT_ALLOWED_MODELS
    )
  );
  const envDefaultModel = (process.env.GEMINI_DEFAULT_MODEL || '').trim();
  const normalizedEnvDefault = MODEL_ALIASES[envDefaultModel] || envDefaultModel;
  const DEFAULT_MODEL =
    (normalizedEnvDefault && SUPPORTED_MODELS.includes(normalizedEnvDefault)
      ? normalizedEnvDefault
      : '') ||
    (SUPPORTED_MODELS.includes('gemini-4-hydrogen')
      ? 'gemini-4-hydrogen'
      : SUPPORTED_MODELS[0]);

  const SYSTEM_INSTRUCTIONS: Record<string, string> = {
    'gemini-4-carbon': `You are the Principal Systems Architect and Technical Lead at Mushaf Khan Digital Studio.
Your role: Deep technical reasoning, architectural blueprints, scalability audits, database schema planning, security validations, and complex project estimation.
Studio Core Services: Web Development (React, TypeScript, Node.js, Next.js), UI/UX Design, Video Editing, Motion Graphics, 3D/Blender, SEO, Social Media, and AI Automation.
Tone: Highly rigorous, senior engineering perspective, structured with bullet points and technical trade-offs. Provide concise, high-value technical answers.`,

    'gemini-4-argon': `You are the Executive Creative Director and Design Strategist at Mushaf Khan Digital Studio.
Your role: Complex creative direction, interactive design systems, brand positioning, motion identity, UI/UX storytelling, and high-conversion aesthetic strategies.
Studio Core Services: Web Development, UI/UX Design, Video Editing, Motion Graphics, 3D/Blender, SEO, Social Media, and AI Automation.
Tone: Visionary, sharp, design-centric, emphasizing user psychology, visual elegance, and craft.`,

    'gemini-4-hydrogen': `You are the Lead Digital Consultant and Studio Advisor for Mushaf Khan Digital Studio.
Your role: General studio inquiries, portfolio walkthroughs, scoping client briefs, project cost estimates, service recommendations, and onboarding new clients.
Mushaf Khan delivers 8 key disciplines: Web Development, UI/UX Design, Video Editing, Motion Graphics, 3D/Blender, SEO, Social Media, and AI Automation.
Studio Highlights: 14-day rapid delivery sprints, direct engineer-to-client communication (no agency bureaucracy), 5.0 rating on Fiverr Pro, fixed-milestone pricing.
Tone: Warm, highly professional, practical, transparent, and proactive. Encourage booking a consultation or sending a brief when relevant.`,

    'gemini-3.1-flash-lite': `You are the Fast Response Assistant at Mushaf Khan Digital Studio.
Your role: Fast answers, concise pricing overviews, FAQ summaries, availability checks, and quick navigation guidance.
Keep answers under 3-4 sentences or tight bullet points. Quick, accurate, and direct.`,
  };

  // Chat API endpoint (Rate-limited, Zod-validated, system instructions server-enforced)
  app.post(
    '/api/chat',
    rateLimitMiddleware(20, 60_000),
    async (req: Request, res: Response) => {
      try {
        const parsed = ChatRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: 'Invalid chat request payload.' });
        }

        const { model, messages } = parsed.data;
        const rawRequestedModel =
          model && model.trim() ? model.trim() : DEFAULT_MODEL;
        const requestedModel =
          MODEL_ALIASES[rawRequestedModel] || rawRequestedModel;

        if (!SUPPORTED_MODELS.includes(requestedModel)) {
          return res.status(400).json({
            error: `Invalid model '${requestedModel}'. Supported models: ${SUPPORTED_MODELS.join(', ')}`,
          });
        }

        if (!process.env.GEMINI_API_KEY) {
          return res.status(500).json({
            error:
              'GEMINI_API_KEY is not configured on the server. Please configure it in Settings > Secrets.',
          });
        }

        // Security: Never accept client-supplied customRole override
        const systemInstruction =
          SYSTEM_INSTRUCTIONS[requestedModel] ||
          SYSTEM_INSTRUCTIONS[DEFAULT_MODEL] ||
          SYSTEM_INSTRUCTIONS['gemini-4-hydrogen'];

        const contents = messages.map((m) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(m.content || m.text || '') }],
        }));

        const candidateModels = Array.from(
          new Set(
            [
              requestedModel,
              DEFAULT_MODEL,
              'gemini-4-hydrogen',
              'gemini-3.1-flash-lite',
            ].filter(Boolean)
          )
        );

        let lastErr: any = null;
        for (const candidate of candidateModels) {
          try {
            const response = await Promise.race([
              ai.models.generateContent({
                model: candidate,
                contents,
                config: {
                  systemInstruction,
                },
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => {
                  const timeoutErr: any = new Error(
                    `Gemini request timed out on ${candidate}`
                  );
                  timeoutErr.status = 504;
                  reject(timeoutErr);
                }, 22_000)
              ),
            ]);

            const replyText =
              response.text ||
              'I processed your request, but received an empty response.';

            return res.json({
              text: replyText,
              model: candidate,
              usage: response.usageMetadata,
            });
          } catch (err: any) {
            lastErr = err;
            const status = err?.status || err?.statusCode || 500;
            const msg = String(err?.message || '').toLowerCase();
            const shouldFallback =
              status === 404 ||
              status === 400 ||
              status === 429 ||
              status === 503 ||
              status === 504 ||
              msg.includes('not found') ||
              msg.includes('not supported') ||
              msg.includes('resource_exhausted') ||
              msg.includes('quota') ||
              msg.includes('timed out') ||
              msg.includes('unavailable');
            if (!shouldFallback) break;
          }
        }

        const statusCode = lastErr?.status || 500;
        const errorMessage =
          lastErr?.message ||
          'An error occurred while communicating with Gemini API.';
        return res.status(statusCode).json({
          error: errorMessage,
          code: lastErr?.code || 'GEMINI_ERROR',
        });
      } catch (err: any) {
        console.error('Gemini API Error:', err);
        const statusCode = err.status || 500;
        const errorMessage =
          err.message ||
          'An error occurred while communicating with Gemini API.';
        return res.status(statusCode).json({
          error: errorMessage,
          code: err.code || 'GEMINI_ERROR',
        });
      }
    }
  );

  // Single-password server-side admin authentication routes
  app.get('/api/admin/session', handleAdminSessionStatus);
  app.post('/api/admin/login', handleAdminLogin);
  app.post('/api/admin/logout', handleAdminLogout);
  app.post('/api/admin/logout-all', handleAdminLogoutAll);

  // Admin CRUD, media upload & public submission endpoints
  registerAdminAndPublicRoutes(app);

  // Serve background videos with immutable long-lived cache headers
  const videosDir =
    isProd && fs.existsSync(path.resolve(__dirname, 'dist', 'videos'))
      ? path.resolve(__dirname, 'dist', 'videos')
      : path.resolve(__dirname, 'public', 'videos');
  app.use(
    '/videos',
    express.static(videosDir, {
      maxAge: '1y',
      immutable: true,
      etag: true,
      setHeaders(res) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    })
  );

  // Serve local uploaded media fallback cleanly
  app.use(
    '/uploads',
    express.static(path.resolve(__dirname, 'public', 'uploads'), {
      maxAge: '1y',
      immutable: true,
    })
  );

  // Health check endpoint with live Firestore connectivity ping (never leaks secrets)
  app.get('/api/health', async (_req: Request, res: Response) => {
    const firestore = await pingFirestoreAdmin();
    res.json({
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      env: isProd ? 'production' : 'development',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      hasAdminPassword: isAdminPasswordConfigured(),
      hasSessionSecret: Boolean(
        (process.env.ADMIN_SESSION_SECRET || '').trim() ||
          (process.env.ADMIN_PASSWORD || '').trim()
      ),
      hasFirebaseAdmin: isFirebaseAdminConfigured(),
      firestore,
      defaultModel: DEFAULT_MODEL,
      models: SUPPORTED_MODELS,
    });
  });

  // Wire SEO snapshot cache invalidation to admin write mutations
  onPublicContentMutated(invalidateSeoCache);

  // Optional canonical host 301 redirect in production when APP_URL is configured
  if (isProd && appUrl) {
    try {
      const targetUrl = new URL(appUrl);
      app.use((req, res, next) => {
        if (req.path === '/api/health') return next();
        const incomingHost = (req.get('host') || '').split(':')[0].toLowerCase();
        if (incomingHost && incomingHost !== targetUrl.hostname.toLowerCase()) {
          return res.redirect(301, `${appUrl}${req.originalUrl}`);
        }
        next();
      });
    } catch {
      // Ignore malformed APP_URL
    }
  }

  // Robots.txt & Dynamic XML Sitemap for Portfolio + Online Store SEO
  app.get('/robots.txt', (req: Request, res: Response) => {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.send(generateRobotsTxt(req));
  });

  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
      const xml = await generateDynamicSitemapXml(req);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (err) {
      res.status(500).header('Content-Type', 'text/plain').send('Failed generating sitemap');
    }
  });

  // Ensure unmatched /api/* endpoints always return JSON rather than SPA HTML
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: `API endpoint not found: ${req.method} ${req.path}`,
    });
  });

  // Setup Vite in development or static serve in production with SSR <head> + 404 handling
  if (isProd) {
    const distDir = path.resolve(__dirname, 'dist');
    const distIndexPath = path.join(distDir, 'index.html');
    const cachedDistTemplate = fs.existsSync(distIndexPath)
      ? fs.readFileSync(distIndexPath, 'utf8')
      : '';

    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        maxAge: '1y',
        immutable: true,
        etag: true,
      })
    );
    app.use(
      express.static(distDir, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.get('*', async (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      try {
        const template =
          cachedDistTemplate || fs.readFileSync(distIndexPath, 'utf8');
        const seo = await resolveRouteSeo(req);
        const html = injectSsrHtml(template, seo);
        return res.status(seo.statusCode).type('text/html').send(html);
      } catch {
        return res.sendFile(distIndexPath);
      }
    });
  } else {
    app.use(
      '/assets',
      express.static(path.resolve(__dirname, 'public', 'assets'), {
        maxAge: '1y',
        immutable: true,
      })
    );
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(async (req, res, next) => {
      const isHtmlNav =
        req.method === 'GET' &&
        req.accepts('html') &&
        !req.path.startsWith('/api') &&
        !req.path.startsWith('/@') &&
        !req.path.startsWith('/src') &&
        !req.path.startsWith('/node_modules') &&
        !path.extname(req.path);

      if (!isHtmlNav) {
        return next();
      }

      try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        const rawTemplate = fs.readFileSync(
          path.resolve(__dirname, 'index.html'),
          'utf8'
        );
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        const seo = await resolveRouteSeo(req);
        const html = injectSsrHtml(transformed, seo);
        return res.status(seo.statusCode).type('text/html').send(html);
      } catch (err) {
        return next(err);
      }
    });
    app.use(vite.middlewares);
  }

  // Structured JSON fallback error handler for API/upload exceptions
  app.use((err: any, req: Request, res: Response, _next: any) => {
    console.error('[server error]', {
      path: req.path,
      message: err?.message || 'Unexpected error',
    });
    if (res.headersSent) return;
    res.status(err?.status || 500).json({
      error: err?.message || 'Internal server error',
    });
  });

  await verifyFirebaseAdminOnStartup();
  await initAdminSessionVersion();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mushaf Khan Studio Server live on http://0.0.0.0:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[server] Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
