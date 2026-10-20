'use client';

import { useState } from 'react';
import { THEMES } from '@/common/themes';

export default function AdminDashboard({ initialTheme }: { initialTheme: string }) {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  const [previewTheme, setPreviewTheme] = useState(initialTheme);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleThemeChange = async (theme: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });

      const data = await response.json();

      if (data.success) {
        setPreviewTheme(theme);
        setCurrentTheme(theme);
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        // Dispatch custom event for ThemeProvider
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));

        setMessage({ type: 'success', text: 'Theme updated successfully!' });

        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to update theme' });
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      setMessage({ type: 'error', text: 'Failed to update theme' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Toast Notification - Fixed Position */}
      {message && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              {message.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span>{message.text}</span>
            <button 
              onClick={() => setMessage(null)} 
              className="btn btn-sm btn-ghost btn-circle"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Theme Settings Card */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-6 md:p-8">
            {/* Header */}
            <div className="mb-6">
              <h2 className="card-title text-3xl mb-2">Theme Settings</h2>
              <p className="text-base-content/70">
                Select a theme to apply across the entire website. Changes are saved automatically.
              </p>
            </div>

            {/* Current Theme Badge */}
            <div className="flex items-center gap-2 p-4 bg-base-200 rounded-lg">
              <span className="text-sm font-medium">Current Theme:</span>
              <span className="badge badge-primary badge-lg capitalize">{currentTheme}</span>
              {saving && <span className="loading loading-spinner loading-sm ml-2"></span>}
            </div>

            <div className="divider my-6">Available Themes</div>

            <p className="text-sm text-base-content/60 mb-4 italic">
              💡 Hover over a theme to preview it below
            </p>

            {/* Theme Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  onMouseEnter={() => setPreviewTheme(theme)}
                  onMouseLeave={() => setPreviewTheme(currentTheme)}
                  disabled={saving}
                  className={`btn ${
                    currentTheme === theme 
                      ? 'btn-primary' 
                      : 'btn-outline btn-neutral'
                  } h-auto py-4 normal-case transition-all ${
                    saving ? 'opacity-50' : 'hover:scale-105'
                  }`}
                >
                  <span className="capitalize text-sm">{theme}</span>
                </button>
              ))}
            </div>

            <div className="divider my-6">
              Theme Preview
              {previewTheme !== currentTheme && (
                <span className="badge badge-secondary ml-2">Previewing: {previewTheme}</span>
              )}
            </div>

            {/* Preview Section */}
            <div 
              className="bg-base-200 p-4 rounded-lg space-y-4 border border-base-300 transition-all duration-300"
              data-theme={previewTheme}
            >
              {/* Cards Section */}
              <div>
                <h3 className="text-base font-semibold mb-3 text-base-content">Cards & Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1 */}
                  <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                      <h2 className="card-title text-base text-primary">Primary Card</h2>
                      <p className="text-sm text-base-content/70">Card with primary colors.</p>
                      <div className="card-actions justify-end mt-2">
                        <button className="btn btn-primary btn-xs">Action</button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="card bg-base-100 shadow-sm border border-primary">
                    <div className="card-body p-4">
                      <h2 className="card-title text-base text-secondary">Secondary Card</h2>
                      <p className="text-sm text-base-content/70">Card with border.</p>
                      <div className="card-actions justify-end mt-2">
                        <button className="btn btn-secondary btn-xs">More</button>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="card bg-primary text-primary-content shadow-sm">
                    <div className="card-body p-4">
                      <h2 className="card-title text-base">Accent Card</h2>
                      <p className="text-sm opacity-80">Full background.</p>
                      <div className="card-actions justify-end mt-2">
                        <button className="btn btn-accent btn-xs">Start</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons & Badges */}
              <div>
                <h3 className="text-base font-semibold mb-3 text-base-content">Buttons & Badges</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-base-content/60 mb-2">Buttons</p>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-primary btn-sm">Primary</button>
                      <button className="btn btn-secondary btn-sm">Secondary</button>
                      <button className="btn btn-accent btn-sm">Accent</button>
                      <button className="btn btn-neutral btn-sm">Neutral</button>
                      <button className="btn btn-ghost btn-sm">Ghost</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60 mb-2">Badges</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge badge-info">Info</span>
                      <span className="badge badge-success">Success</span>
                      <span className="badge badge-warning">Warning</span>
                      <span className="badge badge-error">Error</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forms Section */}
              <div>
                <h3 className="text-base font-semibold mb-3 text-base-content">Form Elements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Form Column 1 */}
                  <div className="space-y-2">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Text Input</legend>
                      <input type="text" placeholder="Enter text" className="input w-full" />
                    </fieldset>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Select Menu</legend>
                      <select className="select w-full" defaultValue="">
                        <option value="" disabled>Choose option</option>
                        <option>Option 1</option>
                        <option>Option 2</option>
                      </select>
                    </fieldset>

                    <label className="label cursor-pointer justify-start gap-3">
                      <input type="checkbox" className="checkbox checkbox-primary" />
                      <span>Accept terms</span>
                    </label>
                  </div>

                  {/* Form Column 2 */}
                  <div className="space-y-2">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Textarea</legend>
                      <textarea
                        className="textarea h-20 w-full"
                        placeholder="Message"
                      ></textarea>
                    </fieldset>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Radio Buttons</legend>
                      <div className="space-y-1">
                        <label className="label cursor-pointer justify-start gap-3">
                          <input type="radio" name="radio-theme" className="radio radio-primary" defaultChecked />
                          <span>Option A</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-3">
                          <input type="radio" name="radio-theme" className="radio radio-secondary" />
                          <span>Option B</span>
                        </label>
                      </div>
                    </fieldset>

                    <label className="label cursor-pointer justify-start gap-3">
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                      <span>Toggle</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Alerts Section */}
              <div>
                <h3 className="text-base font-semibold mb-3 text-base-content">Alerts</h3>
                <div className="space-y-2">
                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Info message</span>
                  </div>
                  <div className="alert alert-success">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Success message</span>
                  </div>
                  <div className="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Warning message</span>
                  </div>
                  <div className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Error message</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
    </>
  );
}
