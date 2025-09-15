'use client'

import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import { PostCard } from './PostCard';
import { Post } from '@/types';

interface PostsGridProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'wordCount';
  filterBy: string;
}

type SortOption = {
  value: 'title' | 'createdAt' | 'updatedAt' | 'wordCount';
  label: string;
};

const sortOptions: SortOption[] = [
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'title', label: 'Title' },
  { value: 'wordCount', label: 'Word Count' },
];

const statusFilters = [
  { value: '', label: 'All Posts' },
  { value: 'draft', label: 'Drafts' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function PostsGrid({ 
  posts, 
  onPostClick, 
  onDeletePost, 
  sortBy: initialSortBy, 
  filterBy: initialFilterBy 
}: PostsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt' | 'wordCount'>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterBy);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'wordCount':
          comparison = a.wordCount - b.wordCount;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [posts, searchQuery, sortBy, sortDirection, statusFilter]);

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
          Filters
          <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort by
              </label>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      sortBy === option.value
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                    {sortBy === option.value && (
                      <span className="ml-2 text-xs">
                        ({sortDirection === 'asc' ? '↑' : '↓'})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      statusFilter === filter.value
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filteredAndSortedPosts.length === posts.length 
          ? `${posts.length} post${posts.length !== 1 ? 's' : ''}`
          : `${filteredAndSortedPosts.length} of ${posts.length} posts`
        }
      </div>

      {/* Posts Grid */}
      {filteredAndSortedPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            {searchQuery || statusFilter 
              ? 'No posts match your current filters.' 
              : 'No posts found.'
            }
          </div>
          {(searchQuery || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
              }}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostClick={onPostClick}
              onDeletePost={onDeletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}