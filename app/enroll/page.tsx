"use client";

"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';

type EnrollmentFormData = {
  parentName: string;
  childName: string;
  childAge: number;
  email: string;
  phone?: string;
  preferredStartDate?: string;
  notes?: string;
};

export default function EnrollPage() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EnrollmentFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit: SubmitHandler<EnrollmentFormData> = async (data) => {
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/enrollment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage('Enrollment request submitted successfully!');
        reset();
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Submission failed');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Daycare Enrollment Request</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">
            Parent Name *
          </label>
          <input
            id="parentName"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('parentName', { required: 'Parent name is required' })}
          />
          {errors.parentName && <p className="mt-1 text-sm text-red-600">{errors.parentName.message}</p>}
        </div>

        <div>
          <label htmlFor="childName" className="block text-sm font-medium text-gray-700">
            Child Name *
          </label>
          <input
            id="childName"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('childName', { required: 'Child name is required' })}
          />
          {errors.childName && <p className="mt-1 text-sm text-red-600">{errors.childName.message}</p>}
        </div>

        <div>
          <label htmlFor="childAge" className="block text-sm font-medium text-gray-700">
            Child Age *
          </label>
          <input
            id="childAge"
            type="number"
            min="0"
            max="12"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('childAge', { 
              required: 'Child age is required',
              min: { value: 0, message: 'Age must be at least 0' },
              max: { value: 12, message: 'Age must be at most 12' }
            })}
          />
          {errors.childAge && <p className="mt-1 text-sm text-red-600">{errors.childAge.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            id="email"
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('email', { 
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
            })}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone (Optional)
          </label>
          <input
            id="phone"
            type="tel"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('phone')}
          />
        </div>

        <div>
          <label htmlFor="preferredStartDate" className="block text-sm font-medium text-gray-700">
            Preferred Start Date (Optional)
          </label>
          <input
            id="preferredStartDate"
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('preferredStartDate')}
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...register('notes')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-4 rounded-md ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}