import { Post, ChatConversation, UserSettings, StorageData, StorageError } from '@/types';

class LocalStorageService {
  private dbName = 'WritingAssistantDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new StorageError('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create posts object store
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          postsStore.createIndex('status', 'status', { unique: false });
          postsStore.createIndex('createdAt', 'createdAt', { unique: false });
          postsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create conversations object store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationsStore.createIndex('createdAt', 'createdAt', { unique: false });
          conversationsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create settings object store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  private ensureDB(): void {
    if (!this.db) {
      throw new StorageError('Database not initialized. Call init() first.');
    }
  }

  // Posts operations
  async savePosts(posts: Post[]): Promise<void> {
    this.ensureDB();
    const transaction = this.db!.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new StorageError('Failed to save posts'));

      posts.forEach(post => {
        // Convert dates to ISO strings for storage
        const postData = {
          ...post,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          analysisHistory: post.analysisHistory.map(analysis => ({
            ...analysis,
            timestamp: analysis.timestamp.toISOString()
          }))
        };
        store.put(postData);
      });
    });
  }

  async savePost(post: Post): Promise<void> {
    this.ensureDB();
    const transaction = this.db!.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');

    return new Promise((resolve, reject) => {
      const postData = {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        analysisHistory: post.analysisHistory.map(analysis => ({
          ...analysis,
          timestamp: analysis.timestamp.toISOString()
        }))
      };

      const request = store.put(postData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError('Failed to save post'));
    });
  }

  async getPosts(): Promise<Post[]> {
    this.ensureDB();
    const transaction = this.db!.transaction(['posts'], 'readonly');
    const store = transaction.objectStore('posts');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const posts = request.result.map((postData: any) => ({
          ...postData,
          createdAt: new Date(postData.createdAt),
          updatedAt: new Date(postData.updatedAt),
          analysisHistory: postData.analysisHistory.map((analysis: any) => ({
            ...analysis,
            timestamp: new Date(analysis.timestamp)
          }))
        }));
        resolve(posts);
      };
      request.onerror = () => reject(new StorageError('Failed to get posts'));
    });
  }

  async getPost(id: string): Promise<Post | null> {
    this.ensureDB();
    const transaction = this.db!.transaction(['posts'], 'readonly');
    const store = transaction.objectStore('posts');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) {
          const postData = request.result;
          const post: Post = {
            ...postData,
            createdAt: new Date(postData.createdAt),
            updatedAt: new Date(postData.updatedAt),
            analysisHistory: postData.analysisHistory.map((analysis: any) => ({
              ...analysis,
              timestamp: new Date(analysis.timestamp)
            }))
          };
          resolve(post);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new StorageError('Failed to get post'));
    });
  }

  async deletePost(id: string): Promise<void> {
    this.ensureDB();
    const transaction = this.db!.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError('Failed to delete post'));
    });
  }

  // Conversations operations
  async saveConversations(conversations: ChatConversation[]): Promise<void> {
    this.ensureDB();
    const transaction = this.db!.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new StorageError('Failed to save conversations'));

      conversations.forEach(conversation => {
        const conversationData = {
          ...conversation,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
          messages: conversation.messages.map(message => ({
            ...message,
            timestamp: message.timestamp.toISOString()
          }))
        };
        store.put(conversationData);
      });
    });
  }

  async saveConversation(conversation: ChatConversation): Promise<void> {
    this.ensureDB();
    const transaction = this.db!.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');

    return new Promise((resolve, reject) => {
      const conversationData = {
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: conversation.messages.map(message => ({
          ...message,
          timestamp: message.timestamp.toISOString()
        }))
      };

      const request = store.put(conversationData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError('Failed to save conversation'));
    });
  }

  async getConversations(): Promise<ChatConversation[]> {
    this.ensureDB();
    const transaction = this.db!.transaction(['conversations'], 'readonly');
    const store = transaction.objectStore('conversations');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const conversations = request.result.map((conversationData: any) => ({
          ...conversationData,
          createdAt: new Date(conversationData.createdAt),
          updatedAt: new Date(conversationData.updatedAt),
          messages: conversationData.messages.map((message: any) => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }))
        }));
        resolve(conversations);
      };
      request.onerror = () => reject(new StorageError('Failed to get conversations'));
    });
  }

  async getConversation(id: string): Promise<ChatConversation | null> {
    this.ensureDB();
    const transaction = this.db!.transaction(['conversations'], 'readonly');
    const store = transaction.objectStore('conversations');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) {
          const conversationData = request.result;
          const conversation: ChatConversation = {
            ...conversationData,
            createdAt: new Date(conversationData.createdAt),
            updatedAt: new Date(conversationData.updatedAt),
            messages: conversationData.messages.map((message: any) => ({
              ...message,
              timestamp: new Date(message.timestamp)
            }))
          };
          resolve(conversation);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new StorageError('Failed to get conversation'));
    });
  }

  async deleteConversation(id: string): Promise<void> {
    this.ensureDB();
    const transaction = this.db!.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError('Failed to delete conversation'));
    });
  }

  // Settings operations
  async saveSettings(settings: UserSettings): Promise<void> {
    this.ensureDB();
    const transaction = this.db!.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.put({ id: 'user-settings', ...settings });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError('Failed to save settings'));
    });
  }

  async getSettings(): Promise<UserSettings> {
    this.ensureDB();
    const transaction = this.db!.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.get('user-settings');
      request.onsuccess = () => {
        if (request.result) {
          const { id, ...settings } = request.result;
          resolve(settings);
        } else {
          // Return default settings if none exist
          const defaultSettings: UserSettings = {
            theme: 'system',
            autoSave: true,
            analysisThreshold: 50,
            defaultVerbosity: 'normal',
            shortcuts: {
              'save': 'Ctrl+S',
              'new-post': 'Ctrl+N',
              'analyze': 'Ctrl+E',
              'chat': 'Ctrl+T'
            }
          };
          resolve(defaultSettings);
        }
      };
      request.onerror = () => reject(new StorageError('Failed to get settings'));
    });
  }

  // Utility operations
  async exportData(): Promise<StorageData> {
    const [posts, conversations, settings] = await Promise.all([
      this.getPosts(),
      this.getConversations(),
      this.getSettings()
    ]);

    return { posts, conversations, settings };
  }

  async importData(data: StorageData): Promise<void> {
    await Promise.all([
      this.savePosts(data.posts),
      this.saveConversations(data.conversations),
      this.saveSettings(data.settings)
    ]);
  }

  async clearAllData(): Promise<void> {
    this.ensureDB();
    const transaction = this.db!.transaction(['posts', 'conversations', 'settings'], 'readwrite');

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new StorageError('Failed to clear data'));

      transaction.objectStore('posts').clear();
      transaction.objectStore('conversations').clear();
      transaction.objectStore('settings').clear();
    });
  }

  // Search operations
  async searchPosts(query: string): Promise<Post[]> {
    const posts = await this.getPosts();
    const lowercaseQuery = query.toLowerCase();

    return posts.filter(post => 
      post.title.toLowerCase().includes(lowercaseQuery) ||
      post.content.toLowerCase().includes(lowercaseQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getPostsByStatus(status: Post['status']): Promise<Post[]> {
    this.ensureDB();
    const transaction = this.db!.transaction(['posts'], 'readonly');
    const store = transaction.objectStore('posts');
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll(status);
      request.onsuccess = () => {
        const posts = request.result.map((postData: any) => ({
          ...postData,
          createdAt: new Date(postData.createdAt),
          updatedAt: new Date(postData.updatedAt),
          analysisHistory: postData.analysisHistory.map((analysis: any) => ({
            ...analysis,
            timestamp: new Date(analysis.timestamp)
          }))
        }));
        resolve(posts);
      };
      request.onerror = () => reject(new StorageError('Failed to get posts by status'));
    });
  }
}

// Create and export singleton instance
export const storageService = new LocalStorageService();

// Export types for convenience
export type { StorageData, StorageError };