'use client'

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  ClockIcon, 
  DocumentTextIcon, 
  TagIcon,
  TrashIcon,
  PencilIcon 
} from '@heroicons/react/24/outline';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onPostClick: (post: Post) => void;
  onDeletePost: (postId: string) => void;
}

const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
};

const statusLabels = {
  draft: 'Draft',
  completed: 'Completed',
  archived: 'Archived',
};

export function PostCard({ post, onPostClick, onDeletePost }: PostCardProps) {
  const handleCardClick = () => {
    onPostClick(post);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeletePost(post.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPostClick(post);
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {post.title}
            </h3>
            <div className="flex items-center mt-1 space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[post.status]}`}>
                {statusLabels[post.status]}
              </span>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-4 h-4 mr-1" />
                {formatDistanceToNow(post.updatedAt, { addSuffix: true })}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Edit post"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete post"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="px-4 pb-2">
        {post.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {post.excerpt}
          </p>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <DocumentTextIcon className="w-4 h-4 mr-1" />
            <span>{post.wordCount.toLocaleString()} words</span>
          </div>
          <div className="text-xs">
            Created {formatDistanceToNow(post.createdAt, { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}