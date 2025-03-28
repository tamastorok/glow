"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/Button";
import { ButtonSecondary } from "~/components/ui/ButtonSecondary";
import { doc, setDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db, auth, signInWithFarcaster } from "~/app/firebase";
import { type Context } from "@farcaster/frame-sdk";
import Image from "next/image";
import { createCast } from "~/lib/neynar";
import { containsProfanity } from "~/utils/profanityFilter";
import { useProfile } from '@farcaster/auth-kit';

declare global {
  interface Window {
    gtag: (command: string, action: string, params: Record<string, unknown>) => void;
  }
}

interface User {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

interface SendComplimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: Context.FrameContext | null;
}

export default function SendComplimentModal({ isOpen, onClose, context }: SendComplimentModalProps) {
  const { profile } = useProfile();
  const [recipient, setRecipient] = useState("");
  const [compliment, setCompliment] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'loading', text: string } | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  // Get the username and fid from either context or profile
  const username = context?.user?.username || profile?.username;
  const fid = context?.user?.fid || profile?.fid;

  // Check daily limit on modal open
  useEffect(() => {
    const fetchDailyCount = async () => {
      if (isOpen && fid && username) {
        try {
          // Ensure Firebase authentication first
          if (!auth.currentUser) {
            console.log('No Firebase user, attempting to sign in...');
            await signInWithFarcaster(fid.toString(), username);
            console.log('Firebase sign in successful');
          }

          await checkDailyLimit(fid.toString());
        } catch (error) {
          console.error('Error fetching daily count:', error);
        }
      }
    };
    
    fetchDailyCount();
  }, [isOpen, fid, username]);

  // Debounced search function
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/neynar/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.result?.users) {
        setSearchResults(data.result.users);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (recipient) {
        searchUsers(recipient);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recipient, searchUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('user-search-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_send_compliment_modal', {
        'event_category': 'Engagement',
        'event_label': 'View Send Compliment Modal',
        'value': 1
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectUser = (username: string) => {
    setRecipient(username);
    setShowDropdown(false);
  };

  const generateComplimentID = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Check user's daily compliment limit
  const checkDailyLimit = async (senderFID: string) => {
    try {
      // Verify Firebase auth state
      if (!auth.currentUser) {
        throw new Error('User not authenticated with Firebase');
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayTimestamp = Timestamp.fromDate(startOfDay);

      const complimentsRef = collection(db, 'compliments');
      const dailyQuery = query(
        complimentsRef,
        where('senderFID', '==', senderFID),
        where('timestamp', '>', startOfDayTimestamp)
      );

      const dailySnap = await getDocs(dailyQuery);
      const count = dailySnap.size;
      console.log('Daily compliments count:', { count, senderFID, auth: !!auth.currentUser });
      setDailyCount(count);

      return count;
    } catch (error) {
      console.error('Error checking daily limit:', error);
      throw error;
    }
  };

  const handleSendCompliment = async () => {
    try {
      // First ensure Firebase authentication
      if (!auth.currentUser) {
        console.log('No Firebase user, attempting to sign in...');
        if (!fid || !username) {
          console.error("Missing fid or username:", { fid, username });
          setStatusMessage({ type: 'error', text: 'Authentication failed: Missing user info' });
          return;
        }
        await signInWithFarcaster(fid.toString(), username);
        console.log('Firebase sign in successful');
      }

      // Add self-compliment check
      if (recipient.toLowerCase() === username?.toLowerCase()) {
        setStatusMessage({ type: 'error', text: 'You cannot send compliments to yourself!' });
        return;
      }

      console.log('Current auth state:', {
        isAuthenticated: !!auth.currentUser,
        uid: auth.currentUser?.uid,
        fid: fid,
        username: username
      });

      if (!fid) {
        console.error("No user context:", context);
        setStatusMessage({ type: 'error', text: 'User not authenticated' });
        throw new Error('User not authenticated');
      }

      if (!recipient.trim() || !compliment.trim()) {
        setStatusMessage({ type: 'error', text: 'Please fill out both recipient and compliment fields' });
        return;
      }

      // Check for profanity
      const profanityCheck = containsProfanity(compliment);
      if (profanityCheck.hasProfanity) {
        setStatusMessage({ 
          type: 'error', 
          text: 'Please keep your compliment appropriate and kind!' 
        });
        return;
      }

      if (dailyCount >= 10) {
        setStatusMessage({ type: 'error', text: 'You have reached the daily limit of 10 compliments. Please try again tomorrow!' });
        return;
      }

      setStatusMessage({ type: 'loading', text: 'Sending...' });

      // Check daily limit
      await checkDailyLimit(fid.toString());

      const complimentID = generateComplimentID();
      const senderFID = fid.toString();
      const senderUsername = username;
      const receiverFID = searchResults.find(user => user.username === recipient)?.fid.toString();
      
      console.log('Attempting to create compliment:', {
        complimentID,
        senderFID,
        senderUsername,
        receiver: recipient,
        receiverFID
      });

      const complimentRef = doc(db, 'compliments', complimentID);
      await setDoc(complimentRef, {
        compliment: compliment,
        complimentID: complimentID,
        receiver: recipient,
        receiverFID: receiverFID,
        sender: senderUsername,
        senderFID: senderFID,
        timestamp: Timestamp.now(),
        isRead: false
      });

      await createCast(recipient);

      // Add Google Analytics event tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'sent_compliment', {
          'event_category': 'Engagement',
          'event_label': 'Compliment Sent',
          'value': 1
        });
      }

      setRecipient("");
      setCompliment("");
      setDailyCount(prev => prev + 1);
      setStatusMessage({ type: 'success', text: 'Compliment sent successfully!' });
      console.log('Compliment sent successfully!');
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error sending compliment:', error);
      setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error sending compliment. Please try again.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full h-full md:rounded-lg p-6 flex flex-col">
        <header className="flex items-center justify-center gap-2 py-4">
          <div className="grid grid-cols-3 items-center mb-4">
            <div className="col-start-1"></div>
            <div className="flex items-center gap-1 justify-center col-start-2">
              <Image 
                src="/icon.png" 
                alt="Glow Logo" 
                className="h-6 w-6"
                width={24}
                height={24}
              />
              <span className="text-xl">GLOW</span>
              <sup className="text-xs text-gray-500">Beta</sup>
            </div>
            <div className="flex justify-end col-start-3">
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
          </div>
        </header>
        
        <div className="w-[300px] mx-auto flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Send compliment</h2>
        </div>
        <div className="w-[300px] mx-auto flex items-center gap-2">
          <p className="text-sm text-gray-500">
              {dailyCount}/5 compliments sent today.
          </p>
        </div>
        
        <div className="w-[300px] mx-auto flex-1 overflow-y-auto">
          <div className="mb-4 relative">
            <label className="block text-m font-large mb-1 font-bold mt-4">Recipient</label>
            <p className="text-sm text-gray-500 mb-1">Find someone on Warpcast.</p>

            <div className="relative">
              <input
                type="text"
                placeholder="Start typing a Warpcast name..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.toLowerCase())}
                className="w-full p-2 border-2 border-[#000000] rounded dark:bg-gray-700"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              )}
            </div>

            {/* Dropdown for search results */}
            {showDropdown && searchResults.length > 0 && (
              <div 
                id="user-search-dropdown"
                className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {searchResults.map((user) => (
                  <div
                    key={user.fid}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    onClick={() => handleSelectUser(user.username)}
                  >
                    <Image
                      src={user.pfp_url || "/default-avatar.png"}
                      alt={user.display_name}
                      className="w-8 h-8 rounded-full"
                      width={32}
                      height={32}
                    />
                    <div>
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-m font-large mb-1 font-bold">Compliment</label>
            <p className="text-sm text-gray-500 mb-1">Brighten someone&apos;s day.</p>
            <textarea
              placeholder="Be nice. We mean it! Max 150 characters."
              value={compliment}
              onChange={(e) => setCompliment(e.target.value.slice(0, 150))}
              maxLength={150}
              className="w-full p-2 border-2 border-[#000000] rounded dark:bg-gray-700 min-h-[200px]"
            />
            <p className="text-sm text-gray-500 mt-1">{compliment.length}/150 characters</p>
          </div>
        </div>
        {statusMessage && (
            <div className={`text-center mt-2 ${
              statusMessage.type === 'success' ? 'text-green-600' : 
              statusMessage.type === 'error' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {statusMessage.text}
            </div>
          )}
        <div className="w-[300px] mx-auto mt-4">
          <div className="flex justify-end gap-2 mb-2 w-full">
            <ButtonSecondary onClick={onClose} className="flex-1">Cancel</ButtonSecondary>
            <Button 
              onClick={handleSendCompliment} 
              className="flex-1"
              disabled={dailyCount >= 5}
            >
              {dailyCount >= 5 ? 'Limit Reached' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
