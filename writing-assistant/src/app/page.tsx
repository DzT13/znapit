'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { PostsGrid } from '@/components/posts/PostsGrid';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const { state, actions } = useApp();
  const { posts, isLoading, error } = state;

  const handleCreatePost = async () => {
    try {
      const post = await actions.createPost('');
      router.push(`/post/${post.id}`);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handlePostClick = (post: any) => {
    router.push(`/post/${post.id}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await actions.deletePost(postId);
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">Error loading data</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your blog posts and writing ideas
            </p>
          </div>
          <button
            onClick={handleCreatePost}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Posts</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Drafts</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posts.filter(p => p.status === 'draft').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="w-5 h-5 text-purple-500 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posts.filter(p => p.status === 'completed').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="w-5 h-5 text-orange-500 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Words</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posts.reduce((total, post) => total + post.wordCount, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
              Get started by creating your first blog post or writing idea.
            </p>
            <button
              onClick={handleCreatePost}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Your First Post
            </button>
          </div>
        ) : (
          <PostsGrid
            posts={posts}
            onPostClick={handlePostClick}
            onDeletePost={handleDeletePost}
            sortBy="updatedAt"
            filterBy=""
          />
        )}
      </div>
    </div>
  );
}
