import React, { useState, useEffect } from 'react';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { LogIn, LogOut, User, Star, Send, Sparkles, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientAuthModal: React.FC<ClientAuthModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Review Form state
  const [authorName, setAuthorName] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [reviewContent, setReviewContent] = useState<string>('');
  const [projectType, setProjectType] = useState<string>('Web Development');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setAuthorName(user.displayName || '');
        // Sync user profile to Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(
            userDocRef,
            {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              role: 'client',
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Profile sync:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to user's quotes
  useEffect(() => {
    if (!currentUser) {
      setQuotes([]);
      return;
    }

    const q = query(collection(db, 'quote_requests'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuotes(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'quote_requests');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to verified client reviews (public)
  useEffect(() => {
    const q = collection(db, 'client_reviews');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReviews(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'client_reviews');
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setErrorMsg('');
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMsg(err.message || 'Google Sign-In failed');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign-Out failed:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !reviewContent.trim()) return;

    setSubmittingReview(true);
    setErrorMsg('');
    try {
      await addDoc(collection(db, 'client_reviews'), {
        userId: currentUser?.uid || 'anonymous',
        authorName: authorName.trim(),
        company: company.trim() || 'Client',
        rating: Number(rating),
        content: reviewContent.trim(),
        projectType,
        createdAt: serverTimestamp(),
      });
      setReviewSuccess(true);
      setReviewContent('');
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'client_reviews');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/35 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-[#E7E3DA] text-[#111111] shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="p-5 bg-[#FAF8F4] border-b border-[#E7E3DA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B6F500]/25 border border-[#6BAA00]/30 flex items-center justify-center text-[#6BAA00]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-display font-medium text-xl text-[#111111]">Client Portal & Cloud Storage</h3>
              <p className="font-mono text-xs text-[#5B5B56]">Google Sign-In with Firebase Auth & Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close client portal"
            className="w-9 h-9 rounded-full bg-white border border-[#E7E3DA] hover:bg-[#FAF8F4] flex items-center justify-center text-[#5B5B56] hover:text-[#111111] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 font-mono text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-white">
          {/* User Authentication Status */}
          {currentUser ? (
            <div className="p-5 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-12 h-12 rounded-full border border-[#6BAA00]/50 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#B6F500] text-[#111111] font-bold flex items-center justify-center text-lg">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base text-[#111111]">{currentUser.displayName || 'Client'}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-[#B6F500]/30 text-[#111111] text-[10px] font-mono font-bold uppercase">
                      Verified Client
                    </span>
                  </div>
                  <p className="font-mono text-xs text-[#5B5B56]">{currentUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF8F4] border border-[#E7E3DA] text-xs font-mono text-[#111111] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#B6F500]/25 border border-[#6BAA00]/30 flex items-center justify-center mx-auto text-[#6BAA00]">
                <User size={22} />
              </div>
              <h4 className="font-display font-medium text-2xl text-[#111111]">Sign In for Client Workspace</h4>
              <p className="font-sans text-xs text-[#5B5B56] max-w-md mx-auto leading-relaxed">
                Log in securely using your Google account to track project quotes, save AI consultations, and submit reviews directly to our studio Firestore database.
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="px-6 py-3.5 rounded-full bg-[#B6F500] text-[#111111] font-mono text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center gap-2.5 mx-auto shadow-sm cursor-pointer"
              >
                <LogIn size={16} />
                <span>Continue with Google Sign-In</span>
              </button>
            </div>
          )}

          {/* User Quotes Section */}
          {currentUser && (
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#5B5B56] font-semibold flex items-center gap-2">
                <span>My Active Project Quotes ({quotes.length})</span>
              </h4>
              {quotes.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-center font-mono text-xs text-[#5B5B56]">
                  No quotes submitted yet. Use the project brief wizard or AI consultant to submit a proposal.
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div>
                        <div className="text-[#111111] font-bold text-sm mb-0.5">{q.services || 'Digital Project'}</div>
                        <div className="text-[#5B5B56]">Budget: {q.budget || 'Custom'} • Timeline: {q.timeline || 'Sprint'}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#B6F500]/30 text-[#111111] font-semibold uppercase">
                        {q.status || 'submitted'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Testimonial / Review Form */}
          <div className="p-5 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-medium text-lg text-[#111111] flex items-center gap-2">
                <Sparkles size={16} className="text-[#6BAA00]" /> Leave a Studio Testimonial
              </h4>
              <span className="font-mono text-[11px] text-[#5B5B56]">Writes to Cloud Firestore</span>
            </div>

            {reviewSuccess && (
              <div className="p-3 bg-[#B6F500]/25 border border-[#6BAA00]/35 rounded-xl text-[#111111] font-mono text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#6BAA00]" /> Thank you! Your verified testimonial has been published to the studio database.
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Your Name (e.g. Tariq Vance)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="bg-white border border-[#E7E3DA] rounded-xl px-3.5 py-2.5 text-xs text-[#111111] placeholder:text-[#5B5B56]/70 focus:outline-none focus:border-[#6BAA00]"
                />
                <input
                  type="text"
                  placeholder="Company / Brand (e.g. Kinetix Studio)"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-white border border-[#E7E3DA] rounded-xl px-3.5 py-2.5 text-xs text-[#111111] placeholder:text-[#5B5B56]/70 focus:outline-none focus:border-[#6BAA00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="bg-white border border-[#E7E3DA] rounded-xl px-3.5 py-2.5 text-xs text-[#111111] focus:outline-none focus:border-[#6BAA00]"
                >
                  <option value="Web Development">Web Development & Apps</option>
                  <option value="3D & Blender">3D & CGI Visualization</option>
                  <option value="Motion Graphics">Motion Graphics & Video</option>
                  <option value="AI Automation">AI Workflow Automation</option>
                  <option value="UI/UX Design">UI/UX & Brand Design</option>
                </select>

                <div className="flex items-center gap-2 bg-white border border-[#E7E3DA] rounded-xl px-3.5 py-2.5">
                  <span className="font-mono text-xs text-[#5B5B56]">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="cursor-pointer"
                    >
                      <Star
                        size={15}
                        className={star <= rating ? 'text-[#6BAA00] fill-[#B6F500]' : 'text-[#E7E3DA]'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={2}
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Share your experience working with Mushaf Khan on design, code, or delivery speed..."
                className="w-full bg-white border border-[#E7E3DA] rounded-xl p-3 text-xs text-[#111111] placeholder:text-[#5B5B56]/70 focus:outline-none focus:border-[#6BAA00] resize-none"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-xl bg-[#B6F500] text-[#111111] font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Send size={13} />
                <span>{submittingReview ? 'Publishing...' : 'Publish Testimonial to Firestore'}</span>
              </button>
            </form>
          </div>

          {/* Live Reviews Feed */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#5B5B56] font-semibold">
              Live Verified Reviews ({reviews.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reviews.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-[#111111] block">{r.authorName}</strong>
                      <span className="font-mono text-[10px] text-[#5B5B56]">{r.company} • {r.projectType}</span>
                    </div>
                    <div className="flex text-[#6BAA00]">
                      {[...Array(r.rating || 5)].map((_, i) => (
                        <Star key={i} size={11} className="fill-[#B6F500]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[#5B5B56] leading-relaxed italic">"{r.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
