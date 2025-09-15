'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  PencilSquareIcon, 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  PencilSquareIcon as PencilSquareIconSolid, 
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid';
import { useApp } from '@/providers/AppProvider';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: HomeIcon, 
    iconSolid: HomeIconSolid 
  },
  { 
    name: 'Posts', 
    href: '/posts', 
    icon: DocumentTextIcon, 
    iconSolid: DocumentTextIconSolid 
  },
  { 
    name: 'Chat', 
    href: '/chat', 
    icon: ChatBubbleLeftRightIcon, 
    iconSolid: ChatBubbleLeftRightIconSolid 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Cog6ToothIcon, 
    iconSolid: Cog6ToothIconSolid 
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { actions } = useApp();

  const handleCreatePost = async () => {
    try {
      const post = await actions.createPost('');
      // Navigate to the new post editor
      router.push(`/post/${post.id}`);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleCreateChat = async () => {
    try {
      const conversation = await actions.createConversation('New Chat');
      actions.setCurrentConversation(conversation);
      // Navigate to chat
      router.push('/chat');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Writing Assistant
        </h1>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCreatePost}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4 mr-2" />
          New Post
        </button>
        <button
          onClick={handleCreateChat}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
          New Chat
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon 
                className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${isActive 
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  }
                `} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Writing Assistant v1.0
        </div>
      </div>
    </div>
  );
}