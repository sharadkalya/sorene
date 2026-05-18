'use client';

import { useState, FormEvent } from 'react';
import styles from './BrandPage.module.css';

interface StayTunedFormProps {
  onSuccess?: () => void;
}

export default function StayTunedForm({ onSuccess }: StayTunedFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!nameRegex.test(name.trim())) {
      return 'Name should only contain letters and spaces';
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stay-tuned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      // Success!
      setSuccess(true);
      setName('');
      setEmail('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting stay tuned form:', err);
      setError('Failed to submit. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.stSuccess}>
        <div className={styles.successIcon}>✓</div>
        <h3 className="text-base-content text-2xl font-light mb-3">Thank You!</h3>
        <p className="text-base-content/70 mb-4">
          We&apos;ve sent your exclusive discount code to your email. 
          Watch your inbox for updates on our next drop.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-primary hover:text-base-content text-sm underline"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <>
      <form 
        id="stay-tuned-form"
        className={styles.stForm} 
        onSubmit={handleSubmit}
      >
        <div className={styles.stFormGroup}>
          <label htmlFor="int-name" className="text-base-content/70">Your Name</label>
          <input
            type="text"
            id="int-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="bg-base-100 border-primary/20 text-base-content focus:border-primary disabled:opacity-50"
          />
        </div>
        <div className={styles.stFormGroup}>
          <label htmlFor="int-email" className="text-base-content/70">Email</label>
          <input
            type="email"
            id="int-email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="bg-base-100 border-primary/20 text-base-content focus:border-primary disabled:opacity-50"
          />
        </div>
      </form>

      {error && (
        <div className={styles.stError}>
          <span className="text-red-600">⚠ {error}</span>
        </div>
      )}

      <button
        type="submit"
        form="stay-tuned-form"
        disabled={isLoading}
        className={`${styles.btnInterest} bg-base-content text-base-100 border-base-content hover:bg-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <>
            <span className="loading loading-spinner loading-sm mr-2"></span>
            Sending...
          </>
        ) : (
          'Show Interest'
        )}
      </button>
    </>
  );
}
