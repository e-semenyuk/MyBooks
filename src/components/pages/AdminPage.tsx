'use client'

import { useState } from 'react'

interface AdminPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
}

export default function AdminPage({ showToast }: AdminPageProps) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    price: '',
    description: '',
    stockQuantity: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stockQuantity: parseInt(formData.stockQuantity),
        }),
      })

      if (response.ok) {
        showToast('Book added successfully', 'success')
        setFormData({
          title: '',
          author: '',
          isbn: '',
          price: '',
          description: '',
          stockQuantity: '',
        })
      } else {
        showToast('Failed to add book', 'error')
      }
    } catch (error) {
      showToast('Failed to add book', 'error')
      console.error('Error adding book:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Admin Panel</h2>

      <div className="card max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Add New Book</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
              ISBN
            </label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              required
              className="input"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity
            </label>
            <input
              type="number"
              id="stockQuantity"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? 'Adding Book...' : 'Add Book'}
          </button>
        </form>
      </div>
    </div>
  )
}

