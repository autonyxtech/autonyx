'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BRAND, siteConfig } from '@/content/site';

const bookingSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(120),
  business_name: z.string().trim().min(2, 'Enter your business name.').max(80),
  phone: z.string().trim().min(6, 'Enter a phone or WhatsApp number.').max(30),
  email: z.string().trim().email('Enter a valid email address.'),
  business_type: z.string().min(1, 'Choose a business type.'),
  interests: z.array(z.string()).min(1, 'Select at least one area.'),
  package: z.string().optional(),
  preferred_day: z.string().min(1, 'Choose a preferred day.'),
  time_range: z.string().min(1, 'Choose a time range.'),
  timezone: z.string().min(1, 'Enter your timezone.').max(60, 'Keep the timezone under 60 characters.'),
  message: z.string().max(120, 'Keep your note under 120 characters.'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please agree before sending.' }) }),
  website: z.string().max(0).optional(),
});

type BookingValues = z.infer<typeof bookingSchema>;

const interests = [
  ['website', 'Business website'],
  ['ai_agent', 'AI support or sales agent'],
  ['automation', 'Workflow automation'],
  ['hosting', 'Hosting and maintenance'],
];

const fieldClassName =
  'mt-2 w-full rounded-xl border border-white/12 bg-[#080b13] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/60 focus:ring-2 focus:ring-white/10';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')
).replace(/\/$/, '');

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

export function BookingForm({ initialPackage }: { initialPackage?: string }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    mode: 'onTouched',
    defaultValues: {
      package: initialPackage || '',
      interests: [],
      timezone: getBrowserTimezone(),
      message: '',
      website: '',
    },
  });

  const stepFields: (keyof BookingValues)[][] = [
    ['name', 'business_name', 'phone', 'email'],
    ['business_type', 'interests', 'package'],
    ['preferred_day', 'time_range', 'timezone', 'message', 'consent', 'website'],
  ];

  async function goNext() {
    const isValid = await trigger(stepFields[step]);
    if (isValid) setStep((current) => Math.min(current + 1, 2));
  }

  async function onSubmit(values: BookingValues) {
    setStatus('submitting');
    setSubmitError('');
    try {
      const response = await fetch(`${API_URL}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          need: [
            `Business ${values.business_name}`,
            `needs ${values.interests.join(', ')}`,
            `call ${values.preferred_day}, ${values.time_range} ${values.timezone}`,
            values.message ? `note ${values.message}` : '',
          ]
            .filter(Boolean)
            .join('; '),
          source_page: typeof window === 'undefined' ? '/contact' : window.location.pathname,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? 'We have received many requests. Please try again shortly.'
            : 'The request could not be sent. Please try again or contact us directly.',
        );
      }

      setStatus('success');
    } catch (error) {
      setStatus('error');
      setSubmitError(
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : 'The booking service is not connected right now. You can reach us by email or WhatsApp instead.',
      );
    }
  }

  if (status === 'success') {
    return (
      <div className="booking-success" role="status" aria-live="polite">
        <div className="success-mark"><Check aria-hidden="true" /></div>
        <p className="eyebrow">Request received</p>
        <h2>Thanks. We’ll be in touch.</h2>
        <p>
          We’ll confirm your call on WhatsApp or email. {BRAND.responseTime}.
        </p>
        <a className="text-link" href={BRAND.whatsappLink} target="_blank" rel="noreferrer">
          Message us on WhatsApp <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-progress" aria-label={`Step ${step + 1} of 3`}>
        {['About you', 'What you need', 'When to talk'].map((label, index) => (
          <div className={`progress-step ${index <= step ? 'is-active' : ''}`} key={label}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="form-step">
          <div>
            <p className="eyebrow">Step 01</p>
            <h2>Let’s start with the basics.</h2>
            <p className="form-step-description">Share the best way for our team to reach you about your enquiry.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              Your name
              <input autoComplete="name" placeholder="Name" {...register('name')} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </label>
            <label className="field">
              Business name
              <input autoComplete="organization" placeholder="Company or business" {...register('business_name')} />
              {errors.business_name && <span className="field-error">{errors.business_name.message}</span>}
            </label>
            <label className="field">
              Phone or WhatsApp
              <input autoComplete="tel" type="tel" placeholder="+91 ..." {...register('phone')} />
              {errors.phone && <span className="field-error">{errors.phone.message}</span>}
            </label>
            <label className="field">
              Work email
              <input autoComplete="email" type="email" placeholder="you@business.com" {...register('email')} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </label>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="form-step">
          <div>
            <p className="eyebrow">Step 02</p>
            <h2>Where can we make a difference?</h2>
            <p className="form-step-description">Choose the areas you’re exploring. It’s fine if you’re still deciding.</p>
          </div>
          <label className="field">
            Business type
            <select {...register('business_type')} className={fieldClassName}>
              <option value="">Choose one</option>
              <option value="energy_solar">Energy or solar</option>
              <option value="professional_services">Professional services</option>
              <option value="retail_ecommerce">Retail or e-commerce</option>
              <option value="healthcare">Healthcare</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="other">Other</option>
            </select>
            {errors.business_type && <span className="field-error">{errors.business_type.message}</span>}
          </label>
          <fieldset className="field">
            <legend>Areas of interest</legend>
            <div className="interest-list">
              {interests.map(([value, label]) => (
                <label className="interest-option" key={value}>
                  <input type="checkbox" value={value} {...register('interests')} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.interests && <span className="field-error">{errors.interests.message}</span>}
          </fieldset>
          <label className="field">
            Package (optional)
            <select {...register('package')} className={fieldClassName}>
              <option value="">Help me decide</option>
              {siteConfig.packages.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="form-step">
          <div>
            <p className="eyebrow">Step 03</p>
            <h2>When works for a first conversation?</h2>
            <p className="form-step-description">These are preferences, not a confirmed booking. We’ll follow up to agree a time.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              Preferred day
              <select {...register('preferred_day')} className={fieldClassName}>
                <option value="">Choose a day</option>
                <option value="weekday">A weekday</option>
                <option value="weekend">Weekend</option>
                <option value="flexible">I’m flexible</option>
              </select>
              {errors.preferred_day && <span className="field-error">{errors.preferred_day.message}</span>}
            </label>
            <label className="field">
              Time range
              <select {...register('time_range')} className={fieldClassName}>
                <option value="">Choose a time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="flexible">I’m flexible</option>
              </select>
              {errors.time_range && <span className="field-error">{errors.time_range.message}</span>}
            </label>
          </div>
          <label className="field">
            Timezone
            <input {...register('timezone')} />
            {errors.timezone && <span className="field-error">{errors.timezone.message}</span>}
          </label>
          <label className="field">
            Anything else we should know? <span className="field-muted">Optional</span>
            <textarea rows={3} placeholder="A short note about what you are looking to do." {...register('message')} />
            {errors.message && <span className="field-error">{errors.message.message}</span>}
          </label>
          <label className="honeypot" aria-hidden="true">
            Leave this field empty
            <input tabIndex={-1} autoComplete="off" {...register('website')} />
          </label>
          <label className="consent-option">
            <input type="checkbox" {...register('consent')} />
            <span>
              I agree to the use of my details to respond to this enquiry. See the{' '}
              <a href="/privacy-policy/" target="_blank" rel="noreferrer">Privacy Policy</a>.
            </span>
          </label>
          {errors.consent && <span className="field-error">{errors.consent.message}</span>}
        </div>
      )}

      {submitError && (
        <div className="form-error" role="alert">
          <p>{submitError}</p>
          <div className="flex flex-wrap gap-4">
            <a href={`mailto:${BRAND.email}`}>Email us</a>
            <a href={BRAND.whatsappLink} target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      )}

      <div className="form-actions">
        {step > 0 ? (
          <button type="button" className="button button-quiet" onClick={() => setStep((current) => current - 1)}>
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>
        ) : <span />}
        {step < 2 ? (
          <button type="button" className="button button-primary" onClick={goNext}>
            Continue <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button type="submit" className="button button-primary" disabled={status === 'submitting'}>
            {status === 'submitting' ? <><LoaderCircle className="animate-spin" size={16} /> Sending…</> : <>Request a call <ArrowRight size={16} aria-hidden="true" /></>}
          </button>
        )}
      </div>
    </form>
  );
}
