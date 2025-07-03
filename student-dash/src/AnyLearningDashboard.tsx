import React, { useState, useEffect, FC, CSSProperties } from 'react';

//================================================================================
// 1. TYPE DEFINITIONS
//================================================================================

interface User {
  name: string;
  avatarUrl: string;
  theme: 'light' | 'dark';
}

interface ActiveCourse {
  id: string;
  title: string;
  progress: number;
  deadline: string;
  module: string;
}

interface ActiveCourseCardProps { 
  course: ActiveCourse; 
  themeStyles: any;
  onRemove: (id: string) => void;
  onCourseSelect: (course: ActiveCourse) => void;
}

interface LastLesson {
  courseTitle: string;
  lessonTitle: string;
}

interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
}

interface RecommendedCourse {
  id: string;
  title: string;
  description: string;
  module?: string; 
}

interface HeaderProps {
  user: User;
  toggleTheme: () => void;
  themeStyles: any;
  unreadNotifications: number;
  notifications: Notification[]; 
  onNotificationClick: (id: string) => void;
  isMobile: boolean; 
}

interface NotificationPanelProps {
  notifications: Notification[];
  themeStyles: any;
  onNotificationClick: (id: string) => void;
  onClose: () => void;
}

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
  isConfirmation?: boolean;
  onConfirm?: () => void;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  modules: Module[];
  progress: number;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  completed: boolean;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  videoUrl?: string;
}

interface CourseDetailsPanelProps {
  course: CourseDetails;
  themeStyles: any;
  onClose: () => void;
  onLessonSelect: (lessonId: string) => void;
}

interface AccountPanelProps {
  user: User;
  themeStyles: any;
  onClose: () => void;
}

interface VideoPlayerState {
  isOpen: boolean;
  currentLesson: {
    title: string;
    courseTitle: string;
    moduleTitle: string;
    duration: string;
  } | null;
}

//================================================================================
// 2. MOCK DATA
//================================================================================

const mockUser: User = {
  name: 'Alex Johnson',
  avatarUrl: 'https://i.pravatar.cc/150?u=alexjohnson',
  theme: 'light',
};

const mockLastLesson: LastLesson = {
  courseTitle: 'Advanced Neural Networks',
  lessonTitle: 'Module 3: Convolutional Layers',
};

const mockActiveCourses: ActiveCourse[] = [
  {
    id: 'course-1',
    title: 'Advanced Neural Networks',
    module: 'Module 3: Convolutional Layers',
    progress: 58,
    deadline: '2 days remaining',
  },
  {
    id: 'course-2',
    title: 'Data Science with Python',
    module: 'Module 5: Data Visualization',
    progress: 50,
    deadline: '5 days remaining',
  },
  {
    id: 'course-3',
    title: 'Intro to Reinforcement Learning',
    module: 'Module 2: Markov Decision Processes',
    progress: 100,
    deadline: '1 day remaining',
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    message: 'New course "Quantum ML" has been added.',
    date: '2h ago',
    read: false,
  },
  {
    id: 'notif-2',
    message: 'Your assignment for "Data Science" is due soon.',
    date: '1d ago',
    read: false,
  },
  {
    id: 'notif-3',
    message: 'You earned a certificate for "Intro to ML"!',
    date: '3d ago',
    read: true,
  },
];

const mockRecommendedCourses: RecommendedCourse[] = [
    {
        id: 'rec-1',
        title: 'Natural Language Processing',
        description: 'Explore text analysis and generation models.',
        module: 'Module 1: Introduction to NLP',
    },
    {
        id: 'rec-2',
        title: 'MLOps: Deployment & Scaling',
        description: 'Learn to deploy machine learning models in production.',
        module: 'Module 1: Introduction to machine learning',
    },
    {
        id: 'rec-3',
        title: 'Unsupervised Learning Deep Dive',
        description: 'Master clustering and dimensionality reduction techniques.',
        module: 'Module 1: Introduction to clusters',
    },
];

const mockCourseDetailsMap: Record<string, CourseDetails> = {
  'course-1': {
    id: 'course-1',
    title: 'Advanced Neural Networks',
    description: 'Master advanced neural network architectures including CNNs, RNNs, and Transformers. Learn to implement and train these models for various machine learning tasks.',
    instructor: 'Dr. Sarah Chen',
    duration: '8 weeks',
    progress: 75,
    modules: [
      {
        id: 'module-1',
        title: 'Introduction to Neural Networks',
        completed: true,
        lessons: [
          { id: 'lesson-1', title: 'Neural Network Basics', duration: '45 min', completed: true, locked: false },
          { id: 'lesson-2', title: 'Activation Functions', duration: '30 min', completed: true, locked: false },
          { id: 'lesson-3', title: 'Backpropagation', duration: '60 min', completed: true, locked: false },
        ]
      },
      {
        id: 'module-2',
        title: 'Deep Learning Fundamentals',
        completed: true,
        lessons: [
          { id: 'lesson-4', title: 'Optimization Algorithms', duration: '50 min', completed: true, locked: false },
          { id: 'lesson-5', title: 'Regularization Techniques', duration: '40 min', completed: true, locked: false },
          { id: 'lesson-6', title: 'Hyperparameter Tuning', duration: '55 min', completed: true, locked: false },
        ]
      },
      {
        id: 'module-3',
        title: 'Convolutional Neural Networks',
        completed: false,
        lessons: [
          { id: 'lesson-7', title: 'CNN Architecture', duration: '50 min', completed: true, locked: false },
          { id: 'lesson-8', title: 'Pooling Layers', duration: '35 min', completed: false, locked: false },
          { id: 'lesson-9', title: 'Transfer Learning', duration: '60 min', completed: false, locked: true },
        ]
      },
      {
        id: 'module-4',
        title: 'Recurrent Neural Networks',
        completed: false,
        lessons: [
          { id: 'lesson-10', title: 'RNN Basics', duration: '45 min', completed: false, locked: true },
          { id: 'lesson-11', title: 'LSTM Networks', duration: '50 min', completed: false, locked: true },
          { id: 'lesson-12', title: 'GRU Networks', duration: '40 min', completed: false, locked: true },
        ]
      }
    ]
  },
  'course-2': {
    id: 'course-2',
    title: 'Data Science with Python',
    description: 'Learn data analysis, visualization, and machine learning with Python. Master pandas, matplotlib, and scikit-learn for real-world data science applications.',
    instructor: 'Prof. Michael Johnson',
    duration: '6 weeks',
    progress: 45,
    modules: [
      {
        id: 'module-1',
        title: 'Data Wrangling',
        completed: true,
        lessons: [
          { id: 'lesson-1', title: 'Introduction to Pandas', duration: '40 min', completed: true, locked: false },
          { id: 'lesson-2', title: 'Data Cleaning', duration: '50 min', completed: true, locked: false },
        ]
      },
      {
        id: 'module-2',
        title: 'Data Visualization',
        completed: false,
        lessons: [
          { id: 'lesson-3', title: 'Matplotlib Basics', duration: '45 min', completed: false, locked: false },
          { id: 'lesson-4', title: 'Seaborn for Statistical Plots', duration: '35 min', completed: false, locked: true },
        ]
      }
    ]
  },
  'course-3': {
    id: 'course-3',
    title: 'Intro to Reinforcement Learning',
    description: 'Discover the fundamentals of reinforcement learning, including Markov Decision Processes, Q-learning, and policy gradient methods.',
    instructor: 'Dr. Emily Wong',
    duration: '4 weeks',
    progress: 90,
    modules: [
      {
        id: 'module-1',
        title: 'Foundations of RL',
        completed: true,
        lessons: [
          { id: 'lesson-1', title: 'MDPs and Value Functions', duration: '50 min', completed: true, locked: false },
          { id: 'lesson-2', title: 'Bellman Equations', duration: '45 min', completed: true, locked: false }
        ]
      },
      {
        id: 'module-2',
        title: 'Learning Algorithms',
        completed: true,
        lessons: [
          { id: 'lesson-3', title: 'Q-Learning', duration: '60 min', completed: true, locked: false },
          { id: 'lesson-4', title: 'SARSA', duration: '45 min', completed: true, locked: false }
        ]
      }
    ]
  },
  'rec-1': {
    id: 'rec-1',
    title: 'Natural Language Processing',
    description: 'Explore text analysis and generation models. Learn about tokenization, word embeddings, and transformer architectures.',
    instructor: 'Dr. Robert Smith',
    duration: '5 weeks',
    progress: 0,
    modules: [
      {
        id: 'module-1',
        title: 'Text Preprocessing',
        completed: false,
        lessons: [
          { id: 'lesson-1', title: 'Tokenization', duration: '30 min', completed: false, locked: false },
          { id: 'lesson-2', title: 'Stemming & Lemmatization', duration: '35 min', completed: false, locked: true }
        ]
      },
      {
        id: 'module-2',
        title: 'Embeddings & Transformers',
        completed: false,
        lessons: [
          { id: 'lesson-3', title: 'Word2Vec & GloVe', duration: '50 min', completed: false, locked: true },
          { id: 'lesson-4', title: 'BERT & GPT Overview', duration: '55 min', completed: false, locked: true }
        ]
      }
    ]
  },
  'rec-2': {
    id: 'rec-2',
    title: 'MLOps: Deployment & Scaling',
    description: 'Learn to deploy machine learning models in production. Cover CI/CD for ML, model monitoring, and scaling techniques.',
    instructor: 'Prof. Lisa Zhang',
    duration: '7 weeks',
    progress: 0,
    modules: [
      {
        id: 'module-1',
        title: 'Deployment Strategies',
        completed: false,
        lessons: [
          { id: 'lesson-1', title: 'Model Serving Basics', duration: '40 min', completed: false, locked: false },
          { id: 'lesson-2', title: 'Dockerizing ML Models', duration: '45 min', completed: false, locked: true }
        ]
      },
      {
        id: 'module-2',
        title: 'Pipelines & Monitoring',
        completed: false,
        lessons: [
          { id: 'lesson-3', title: 'CI/CD for ML', duration: '50 min', completed: false, locked: true },
          { id: 'lesson-4', title: 'Model Drift Detection', duration: '40 min', completed: false, locked: true }
        ]
      }
    ]
  },
  'rec-3': {
    id: 'rec-3',
    title: 'Unsupervised Learning Deep Dive',
    description: 'Master clustering and dimensionality reduction techniques including k-means, DBSCAN, and t-SNE.',
    instructor: 'Dr. James Wilson',
    duration: '6 weeks',
    progress: 0,
    modules: [
      {
        id: 'module-1',
        title: 'Clustering Techniques',
        completed: false,
        lessons: [
          { id: 'lesson-1', title: 'k-means Clustering', duration: '40 min', completed: false, locked: false },
          { id: 'lesson-2', title: 'Hierarchical Clustering', duration: '35 min', completed: false, locked: true }
        ]
      },
      {
        id: 'module-2',
        title: 'Dimensionality Reduction',
        completed: false,
        lessons: [
          { id: 'lesson-3', title: 'PCA & t-SNE', duration: '45 min', completed: false, locked: true },
          { id: 'lesson-4', title: 'Autoencoders for Compression', duration: '50 min', completed: false, locked: true }
        ]
      }
    ]
  }
};

//================================================================================
// 3. SVG ICONS & HELPER COMPONENTS
//================================================================================

const BellIcon: FC<{ style?: CSSProperties; unreadCount?: number }> = ({ style, unreadCount = 0 }) => (
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {unreadCount > 0 && (
      <span style={{
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: colors.primaryBlue,
        color: colors.textLight,
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }}>
        {unreadCount}
      </span>
    )}
  </div>
);

const TrashIcon: FC<{ style?: CSSProperties }> = ({ style }) => (
  <svg 
    style={style} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
    />
  </svg>
);

const ChevronDownIcon: FC<{ style?: CSSProperties }> = ({ style }) => (
    <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const MoonIcon: FC<{ style?: CSSProperties }> = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon: FC<{ style?: CSSProperties }> = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ProgressRing: FC<{ progress: number; size: number; strokeWidth: number }> = ({ progress, size, strokeWidth }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={styles.progressRingContainer}>
      <svg width={size} height={size} style={styles.progressRingSvg}>
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="#10B981" 
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={styles.progressRingIndicator}
        />
      </svg>
      <span style={styles.progressRingText}>{`${progress}%`}</span>
    </div>
  );
};

const getResponsiveStyles = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    return {
        mainGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
            gap: isMobile ? '1rem' : '2rem',
            padding: isMobile ? '1rem' : '1.5rem',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%', 
            boxSizing: 'border-box' as React.CSSProperties['boxSizing'],
            overflowX: 'hidden' as 'hidden',
        },
        continueLearningCard: {
            backgroundColor: colors.primaryBlue,
            color: colors.textLight,
            display: 'flex',
            flexDirection: isMobile ? ('column' as React.CSSProperties['flexDirection']) : ('row' as React.CSSProperties['flexDirection']),
            justifyContent: 'space-between',
            alignItems: isMobile ? ('flex-start' as React.CSSProperties['alignItems']) : ('center' as React.CSSProperties['alignItems']),
            gap: '1rem',
        },
        courseCardContent: {
            display: 'flex',
            flexDirection: isMobile ? ('column' as React.CSSProperties['flexDirection']) : ('row' as React.CSSProperties['flexDirection']),
            justifyContent: 'space-between',
            alignItems: isMobile ? ('flex-start' as React.CSSProperties['alignItems']) : ('center' as React.CSSProperties['alignItems']),
            gap: '1rem',
        },
        activeCoursesContainer: {
            width: '100%',
            overflowX: 'hidden',
        },
        activeCoursesGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
        },
        footerTextContainer: {
            width: isMobile ? '100%' : 'auto',
            textAlign: isMobile ? 'center' as React.CSSProperties['textAlign'] : 'left' as React.CSSProperties['textAlign'],
        },
        footerContent: {
            flexDirection: (isMobile ? 'column' : 'row') as React.CSSProperties['flexDirection'],
            alignItems: (isMobile ? 'flex-start' : 'center') as React.CSSProperties['alignItems'],
        },
        footerLinks: {
            gap: isMobile ? '1rem' : '1.5rem',
        }
    };
};

//================================================================================
// 4. UI SECTION COMPONENTS
//================================================================================

const Header: FC<HeaderProps> = ({ 
  user, 
  toggleTheme, 
  themeStyles, 
  unreadNotifications,
  notifications,
  onNotificationClick,
  isMobile
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountPanel, setShowAccountPanel] = useState(false);

  const handleBellClick = () => {
    if (isMobile) { 
      setShowNotifications(!showNotifications);
      setShowAccountPanel(false);
    }
  };

  const handleAvatarClick = () => {
    if (isMobile) {
      setShowAccountPanel(!showAccountPanel);
      setShowNotifications(false);
    }
  };

  return (
    <header style={themeStyles.header}>
      <div>
        <h1 style={{ 
          ...styles.headerLogo, 
          color: user.theme === 'dark' ? colors.textLight : colors.primaryBlue 
        }}>
          AnyLearning
        </h1>
        <h2 style={{...styles.headerWelcome, color: themeStyles.textSecondary.color}}>Welcome back, {user.name}!</h2>
      </div>
      <div style={styles.headerProfile}>
        <button 
          onClick={toggleTheme} 
          style={styles.themeToggle}
          aria-label={user.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {user.theme === 'light' ? (
            <MoonIcon style={{...styles.themeIcon, color: themeStyles.textSecondary.color}} />
          ) : (
            <SunIcon style={{...styles.themeIcon, color: themeStyles.textSecondary.color}} />
          )}
        </button>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={handleBellClick} 
            style={{
              ...styles.bellButton,
              cursor: isMobile ? 'pointer' : 'default', 
              opacity: isMobile ? 1 : 0.7 
            }}
            aria-label={isMobile ? "Notifications" : "Notifications (available in mobile)"}
          >
            <BellIcon 
              style={{
                ...styles.bellIcon, 
                color: themeStyles.textSecondary.color,
                pointerEvents: isMobile ? 'auto' : 'none' 
              }} 
              unreadCount={unreadNotifications}
            />
          </button>
          {isMobile && showNotifications && ( 
            <NotificationPanel 
              notifications={notifications}
              themeStyles={themeStyles}
              onNotificationClick={onNotificationClick}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>
        {isMobile && (
          <button 
            onClick={handleAvatarClick}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
            aria-label="Account settings"
          >
            <img src={user.avatarUrl} alt={user.name} style={styles.avatar} />
          </button>
        )}
        {isMobile && showAccountPanel && (
          <AccountPanel 
            user={user}
            themeStyles={themeStyles}
            onClose={() => setShowAccountPanel(false)}
          />
        )}
      </div>
    </header>
  );
};

const ProfileSection: FC<{ user: User; themeStyles: any }> = ({ user, themeStyles }) => {
  return (
    <div style={{...themeStyles.card, ...styles.sidebarCard}}>
      <div style={styles.accountInfo}>
        <img 
          src={user.avatarUrl} 
          alt={user.name} 
          style={{ 
            ...styles.avatar, 
            width: '80px', 
            height: '80px',
            marginBottom: '1rem'
          }} 
        />
        <h4 style={{ 
          ...styles.accountName, 
          color: themeStyles.card.color,
          margin: '0 0 0.5rem 0'
        }}>
          {user.name}
        </h4>
        <p style={{ 
          color: themeStyles.textSecondary.color,
          margin: 0
        }}>
          {user.theme === 'light' ? 'Light Mode' : 'Dark Mode'}
        </p>
      </div>
    </div>
  );
};

const ToastNotification: FC<{ 
  notification: ToastNotification; 
  themeStyles: any;
  onDismiss: (id: string) => void;
}> = ({ notification, themeStyles, onDismiss }) => {
  const getToastStyles = () => {
    const baseStyle: CSSProperties = {
      backgroundColor: notification.type === 'success' 
        ? 'rgba(16, 185, 129, 0.85)' 
        : notification.type === 'error'
          ? 'rgba(239, 68, 68, 0.85)'
          : 'rgba(59, 130, 246, 0.85)',
      color: colors.textLight,
      padding: '0.75rem 1rem',
      width: 'auto',
      maxWidth: '90%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    };

    if (themeStyles.dashboardContainer.backgroundColor === colors.darkBackground) {
      baseStyle.backgroundColor = notification.type === 'success' 
        ? 'rgba(5, 150, 105, 0.9)' 
        : notification.type === 'error'
          ? 'rgba(220, 38, 38, 0.9)'
          : 'rgba(29, 78, 216, 0.9)';
    }

    return baseStyle;
  };

  const handleConfirm = () => {
    notification.onConfirm?.();
    onDismiss(notification.id);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg style={styles.toastIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="2" fill="none" />
            <path stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 12l2 2 4-4" />
          </svg>
        );
      case 'error':
        return (
          <svg style={styles.toastIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" fill="none" />
            <path stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
          </svg>
        );
      default:
        return (
          <svg style={styles.toastIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="2" fill="none" />
            <path stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
          </svg>
        );
    }
  };

  return (
    <div 
      style={{ 
        ...styles.toastNotification, 
        ...getToastStyles(),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {getIcon()}
        <p style={{...styles.toastMessage, fontWeight: 'bold'}}>{notification.message}</p>
      </div>
      
      {notification.isConfirmation && (
        <div style={styles.confirmationButtons}>
          <button 
            onClick={handleConfirm}
            style={{
              ...styles.confirmButton,
              color: getToastStyles().backgroundColor 
            }}
          >
            Confirm
          </button>
          <button 
            onClick={() => onDismiss(notification.id)}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

const ToastContainer: FC<{ 
  notifications: ToastNotification[]; 
  themeStyles: any;
  onDismiss: (id: string) => void;
}> = ({ notifications, themeStyles, onDismiss }) => {
  return (
    <div style={styles.toastContainer}>
      {notifications.map(notification => (
        <ToastNotification 
          key={notification.id} 
          notification={notification} 
          themeStyles={themeStyles}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

const ContinueLearningCard: FC<{ 
  lastLesson: LastLesson; 
  responsiveStyles: any; 
  themeStyles: any; 
  onContinue: () => void 
}> = ({ lastLesson, responsiveStyles, themeStyles, onContinue }) => (
  <div style={{...styles.card, ...styles.continueLearningCard, ...responsiveStyles.continueLearningCard}}>
    <div>
      <p style={styles.continueSubtitle}>LAST VIEWED</p>
      <h3 style={styles.continueCourseTitle}>{lastLesson.courseTitle}</h3>
      <p style={styles.continueLessonTitle}>{lastLesson.lessonTitle}</p>
    </div>
    <button 
      style={{ 
        ...styles.continueButton, 
        backgroundColor: themeStyles.continueButton.backgroundColor,
        color: themeStyles.continueButton.color
      }}
      onClick={onContinue}
    >
      Continue Learning
    </button>  
  </div>
);

const CourseDetailsPanel: FC<CourseDetailsPanelProps> = ({ course, themeStyles, onClose, onLessonSelect }) => {
  const [expandedModule, setExpandedModule] = useState<string | null>(course.modules[0].id);

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const calculateOverallProgress = () => {
    const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const completedLessons = course.modules.reduce((sum, module) => {
      return sum + module.lessons.filter(lesson => lesson.completed).length;
    }, 0);
    return Math.round((completedLessons / totalLessons) * 100);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem',
    }}>
      <div style={{
        ...themeStyles.card,
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: themeStyles.card.color,
          }}
          aria-label="Close course details"
        >
          &times;
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Course Header */}
          <div>
            <h2 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 600, 
              margin: '0 0 0.5rem 0',
              color: themeStyles.card.color 
            }}>
              {course.title}
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              color: themeStyles.textSecondary.color,
              margin: '0 0 1rem 0'
            }}>
              {course.description}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: themeStyles.textSecondary.color,
                  margin: '0 0 0.25rem 0'
                }}>
                  Instructor
                </p>
                <p style={{ 
                  fontSize: '1rem', 
                  fontWeight: 500,
                  color: themeStyles.card.color,
                  margin: 0
                }}>
                  {course.instructor}
                </p>
              </div>
              <div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: themeStyles.textSecondary.color,
                  margin: '0 0 0.25rem 0'
                }}>
                  Duration
                </p>
                <p style={{ 
                  fontSize: '1rem', 
                  fontWeight: 500,
                  color: themeStyles.card.color,
                  margin: 0
                }}>
                  {course.duration}
                </p>
              </div>
              <div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: themeStyles.textSecondary.color,
                  margin: '0 0 0.25rem 0'
                }}>
                  Progress
                </p>
                <p style={{ 
                  fontSize: '1rem', 
                  fontWeight: 500,
                  color: themeStyles.card.color,
                  margin: 0
                }}>
                  {calculateOverallProgress()}% completed
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', backgroundColor: themeStyles.card.borderColor, borderRadius: '4px' }}>
            <div 
              style={{ 
                width: `${calculateOverallProgress()}%`, 
                height: '100%', 
                backgroundColor: colors.primaryGreen,
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Modules Accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {course.modules.map(module => (
              <div key={module.id} style={{ border: `1px solid ${themeStyles.card.borderColor}`, borderRadius: '8px' }}>
                <button
                  onClick={() => toggleModule(module.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: module.completed ? colors.primaryGreen : themeStyles.card.borderColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {module.completed && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 600,
                      color: themeStyles.card.color,
                      margin: 0,
                      textAlign: 'left'
                    }}>
                      {module.title}
                    </h3>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={themeStyles.card.color}
                    style={{
                      transform: expandedModule === module.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedModule === module.id && (
                  <div style={{ padding: '0 1rem 1rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {module.lessons.map(lesson => (
                        <button
                          key={lesson.id}
                          onClick={() => !lesson.locked && onLessonSelect(lesson.id)}
                          disabled={lesson.locked}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: lesson.locked 
                              ? themeStyles.card.borderColor 
                              : lesson.completed 
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'transparent',
                            cursor: lesson.locked ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {lesson.completed ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primaryGreen} strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                <path d="M22 4L12 14.01l-3-3" />
                              </svg>
                            ) : lesson.locked ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={themeStyles.textSecondary.color} strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                              </svg>
                            ) : (
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: `2px solid ${themeStyles.textSecondary.color}`,
                              }} />
                            )}
                            <span style={{ 
                              color: lesson.locked ? themeStyles.textSecondary.color : themeStyles.card.color,
                              fontWeight: 500
                            }}>
                              {lesson.title}
                            </span>
                          </div>
                          <span style={{ 
                            color: themeStyles.textSecondary.color,
                            fontSize: '0.875rem'
                          }}>
                            {lesson.duration}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveCourseCard: FC<ActiveCourseCardProps> = ({ 
  course, 
  themeStyles, 
  onRemove,
  onCourseSelect
}) => (
    <div style={themeStyles.card}>
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => onRemove(course.id)}
                style={styles.removeButton}
                aria-label="Remove course"
            >
                <TrashIcon style={styles.trashIcon} />
            </button>
            <div style={styles.courseCardContent}>
                <div style={styles.courseInfo}>
                    <h4 style={{...styles.courseTitle, color: themeStyles.card.color}}>{course.title}</h4>
                    <p style={{...styles.courseModule, color: themeStyles.textSecondary.color}}>{course.module}</p>
                    <p style={styles.courseDeadline}>{course.deadline}</p>
                    <div style={styles.courseActions}>
                        <button 
                            style={{ 
                                ...styles.courseButton,
                                backgroundColor: 'transparent',
                                border: `1px solid ${colors.primaryGreen}`,
                                color: colors.primaryGreen,
                            }}
                            onClick={() => onCourseSelect(course)}
                        >
                            {course.progress > 0 ? 'Continue' : 'Start'}
                        </button>
                    </div>
                </div>
                <ProgressRing progress={course.progress} size={80} strokeWidth={8} />
            </div>
        </div>
    </div>
);

const NotificationsSection: FC<{ 
  notifications: Notification[]; 
  themeStyles: any;
  onNotificationClick: (id: string) => void;
}> = ({ notifications, themeStyles, onNotificationClick }) => {
    return (
        <div style={{...themeStyles.card, ...styles.sidebarCard}}>
            <h3 style={themeStyles.sidebarTitle}>Notifications</h3>
            <div style={{
                maxHeight: '260px', 
                overflowY: 'auto',
                paddingRight: '0.5rem',
            }}>
                {notifications.map(notif => ( 
                    <div 
                        key={notif.id} 
                        style={{...styles.notificationItem, borderColor: themeStyles.card.borderColor}}
                        onClick={() => onNotificationClick(notif.id)}
                        className="notification-item"
                    >
                        {notif.read ? (
                            <div style={{
                                ...styles.notificationDotEmpty,
                                borderColor: themeStyles.textSecondary.color
                            }}></div>
                        ) : (
                            <div style={{
                                ...styles.notificationDot, 
                                background: colors.primaryBlue
                            }}></div>
                        )}
                        <div>
                            <p style={{
                                ...styles.notificationMessage, 
                                color: themeStyles.card.color,
                                fontWeight: notif.read ? 'normal' : 'bold' 
                            }}>{notif.message}</p>
                            <p style={{
                                ...styles.notificationDate, 
                                color: themeStyles.textSecondary.color
                            }}>{notif.date}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NotificationPanel: FC<NotificationPanelProps> = ({ 
  notifications, 
  themeStyles, 
  onNotificationClick,
  onClose
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedNotification = (event.target as Element).closest('.notification-item');
      
      if (panelRef.current && 
          !panelRef.current.contains(event.target as Node) && 
          !clickedNotification) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={panelRef}
      style={{
        ...styles.notificationPanel,
        backgroundColor: themeStyles.card.backgroundColor,
        borderColor: themeStyles.card.borderColor,
      }}
    >
      <div style={styles.notificationPanelHeader}>
        <h3 style={themeStyles.sidebarTitle}>Notifications</h3>
        <button 
          onClick={onClose} 
          style={styles.notificationPanelClose}
          aria-label="Close notifications"
        >
          &times;
        </button>
      </div>
      <div style={styles.notificationPanelContent}>
        {notifications.slice(0, 4).map(notif => (
          <div 
            key={notif.id} 
            style={{...styles.notificationItem, borderColor: themeStyles.card.borderColor}}
            onClick={() => {
              onNotificationClick(notif.id);
            }}
            className="notification-item"
          >
            {notif.read ? (
              <div style={{
                ...styles.notificationDotEmpty,
                borderColor: themeStyles.textSecondary.color
              }}></div>
            ) : (
              <div style={{
                ...styles.notificationDot, 
                background: colors.primaryBlue
              }}></div>
            )}
            <div>
              <p style={{
                ...styles.notificationMessage, 
                color: themeStyles.card.color,
                fontWeight: notif.read ? 'normal' : 'bold'
              }}>{notif.message}</p>
              <p style={{
                ...styles.notificationDate, 
                color: themeStyles.textSecondary.color
              }}>{notif.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AccountPanel: FC<AccountPanelProps> = ({ 
  user, 
  themeStyles, 
  onClose 
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={panelRef}
      style={{
        ...styles.notificationPanel,
        backgroundColor: themeStyles.card.backgroundColor,
        borderColor: themeStyles.card.borderColor,
        right: '1rem',
        left: 'auto',
        width: 'calc(100% - 2rem)', 
        maxWidth: '350px', 
      }}
    >
      <div style={styles.notificationPanelHeader}>
        <h3 style={themeStyles.sidebarTitle}>Account</h3>
        <button 
          onClick={onClose} 
          style={styles.notificationPanelClose}
          aria-label="Close account panel"
        >
          &times;
        </button>
      </div>
      
    <div style={styles.accountPanelContent}>
    <div style={styles.accountInfo}>
        <img 
        src={user.avatarUrl} 
        alt={user.name} 
        style={{ 
            ...styles.avatar, 
            width: '80px', 
            height: '80px',
            marginBottom: '1rem'
        }} 
        />
        <h4 style={{ 
        ...styles.accountName, 
        color: themeStyles.card.color,
        margin: '0 0 1rem 0'
        }}>
        {user.name}
        </h4>
        <p style={{ 
        color: themeStyles.textSecondary.color,
        margin: '0 0 1rem 0'
        }}>
        {user.theme === 'light' ? 'Light Mode' : 'Dark Mode'}
        </p>
    </div>
    </div>
    </div>
  );
};

const RecommendedCoursesSection: FC<{ 
  courses: RecommendedCourse[]; 
  themeStyles: any;
  onAddCourse: (course: RecommendedCourse) => void;
}> = ({ courses, themeStyles, onAddCourse }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={{...themeStyles.card, ...styles.sidebarCard}}>
            <div style={styles.recommendHeader} onClick={() => setIsExpanded(!isExpanded)}>
                <h3 style={themeStyles.sidebarTitle}>Recommended For You</h3>
                <ChevronDownIcon style={{...styles.chevronIcon, color: themeStyles.textSecondary.color, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}/>
            </div>
            {isExpanded && (
                <div style={styles.recommendList}>
                    {courses.length > 0 ? (
                        courses.map(course => (
                            <div key={course.id} style={{...styles.recommendItem, borderColor: themeStyles.card.borderColor}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{...styles.recommendTitle, color: themeStyles.card.color}}>{course.title}</h4>
                                        <p style={{...styles.recommendDesc, color: themeStyles.textSecondary.color}}>{course.description}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddCourse(course);
                                        }}
                                        style={{
                                            ...styles.addButton,
                                            backgroundColor: themeStyles.card.backgroundColor,
                                            color: themeStyles.card.color,
                                            border: `1px solid ${colors.primaryGreen}`,
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ 
                            textAlign: 'center',
                            padding: '1.5rem 0',
                            color: themeStyles.textSecondary.color
                        }}>
                            No recommendations available at the moment
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Footer: FC<{ themeStyles: any }> = ({ themeStyles }) => {
    const responsiveStyles = getResponsiveStyles();
    
    return (
        <footer style={themeStyles.footer}>
            <div style={{...styles.footerContent, ...responsiveStyles.footerContent}}>
                <div style={{...responsiveStyles.footerTextContainer}}>
                    <p style={{...styles.footerText, color: themeStyles.textSecondary.color}}>
                        © 2023 AnyLearning. All rights reserved.
                    </p>
                </div>
                <div style={{...styles.footerLinks, ...responsiveStyles.footerLinks}}>
                    <a href="#" style={{...styles.footerLink, color: themeStyles.textSecondary.color}}>Terms of Service</a>
                    <a href="#" style={{...styles.footerLink, color: themeStyles.textSecondary.color}}>Privacy Policy</a>
                    <a href="#" style={{...styles.footerLink, color: themeStyles.textSecondary.color}}>Contact Us</a>
                </div>
            </div>
        </footer>
    );
};

const VideoPlayer: FC<{ 
  lesson: VideoPlayerState['currentLesson'];
  themeStyles: any;
  onClose: () => void;
}> = ({ lesson, themeStyles, onClose }) => {
  if (!lesson) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0.5rem',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '0.75rem', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1,
      }}>
        <div style={{ maxWidth: 'calc(100% - 40px)' }}> 
          <h3 style={{ 
            color: colors.textLight, 
            margin: 0,
            fontSize: 'clamp(1rem, 4vw, 1.25rem)', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {lesson.courseTitle}
          </h3>
          <p style={{ 
            color: colors.textLight, 
            margin: '0.25rem 0 0 0',
            opacity: 0.8,
            fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {lesson.moduleTitle} • {lesson.title}
          </p>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.textLight,
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            minWidth: '40px',
          }}
          aria-label="Close video"
        >
          &times;
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '1000px',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '0 0.5rem', 
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: colors.textLight,
          backgroundColor: '#111',
        }}>
          <div style={{
            fontSize: 'clamp(2rem, 10vw, 3rem)',
            marginBottom: '0.5rem',
          }}>
            <svg 
              width="1em" 
              height="1em" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                color: colors.textLight,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            >
              <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
          </div>
          <p style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.25rem)', 
            margin: 0,
            textAlign: 'center',
            padding: '0 0.5rem'
          }}>
            {lesson.title}
          </p>
          <p style={{ 
            opacity: 0.7, 
            margin: '0.5rem 0 0 0',
            fontSize: 'clamp(0.8rem, 3vw, 1rem)'
          }}>
            {lesson.duration}
          </p>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '0.75rem',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <button style={{
            ...styles.videoControlButton,
            padding: '0.75rem', 
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textLight}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            flex: 1,
            minWidth: 0 
          }}>
            <span style={{ 
              color: colors.textLight,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}>
              0:00
            </span>
            <div style={{
              flex: 1,
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              position: 'relative',
              cursor: 'pointer',
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                backgroundColor: colors.primaryBlue,
                borderRadius: '2px',
              }} />
              <div style={{
                position: 'absolute',
                top: '-6px',
                left: '30%',
                transform: 'translateX(-50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: colors.primaryBlue,
              }} />
            </div>
            <span style={{ 
              color: colors.textLight,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}>
              {lesson.duration}
            </span>
          </div>
          
          <button style={{
            ...styles.videoControlButton,
            padding: '0.75rem', 
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textLight}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '1000px',
        marginTop: '1rem',
        color: colors.textLight,
        padding: '0 0.5rem',
      }}>
        <h4 style={{ 
          margin: '0 0 0.5rem 0',
          fontSize: 'clamp(1rem, 4vw, 1.25rem)' 
        }}>
          About this lesson
        </h4>
        <p style={{ 
          margin: 0, 
          opacity: 0.9,
          fontSize: 'clamp(0.9rem, 3.5vw, 1rem)'
        }}>
          This is a simulated video player for the lesson "{lesson.title}" which is part of the "{lesson.courseTitle}" course.
        </p>
      </div>
    </div>
  );
};

//================================================================================
// 5. MAIN DASHBOARD COMPONENT
//================================================================================

const AnyLearningDashboard: FC = () => {
  const [user, setUser] = useState<User>(mockUser);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetails | null>(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [lastViewedLesson, setLastViewedLesson] = useState<LastLesson>(mockLastLesson); 
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>(mockRecommendedCourses);

    const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' = 'info',
    isConfirmation = false,
    onConfirm?: () => void
    ) => {
    const id = `toast-${Date.now()}`;
    const newToast = {
        id,
        message,
        type,
        timestamp: Date.now(),
        isConfirmation,
        onConfirm,
    };
    
    setToastNotifications(prev => [...prev, newToast]);
    
    if (!isConfirmation) {
        setTimeout(() => {
        dismissToast(id);
        }, 4000);
    }
    };

    const dismissToast = (id: string) => {
    setToastNotifications(prev => prev.filter(toast => toast.id !== id));
    };

    const [videoPlayer, setVideoPlayer] = useState<VideoPlayerState>({
        isOpen: false,
        currentLesson: null
    });

    const handleRemoveCourse = (id: string) => {
        const course = activeCourses.find(c => c.id === id);
        if (course) {
            showToast(
                `Are you sure you want to remove "${course.title}" from your active courses?`, 
                'info',
                true, 
                () => {
                    setActiveCourses(prev => prev.filter(c => c.id !== id));
                    
                    const newNotification: Notification = {
                        id: `notif-${Date.now()}`,
                        message: `Course "${course.title}" has been removed`,
                        date: 'Just now',
                        read: false,
                    };
                    
                    setNotifications(prev => [newNotification, ...prev]);
                }
            );
        }
    };

    const handleAddCourse = (course: RecommendedCourse) => {
    const newActiveCourse: ActiveCourse = {
        id: course.id,
        title: course.title,
        progress: 0,
        deadline: '7 days remaining',
        module: course.module || 'Module 1: Introduction',
    };

    setActiveCourses(prev => [...prev, newActiveCourse]);
    setRecommendedCourses(prev => prev.filter(c => c.id !== course.id)); 

    const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        message: `Course "${course.title}" has been added to your active courses`,
        date: 'Just now',
        read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    showToast(`"${course.title}" has been added to your courses`, 'success');
    };
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const responsiveStyles = getResponsiveStyles();
  
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

    const handleNotificationRead = (id: string) => {
        setNotifications(prev => 
        prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
        )
        );
    };
    
    const toggleTheme = () => {
        setUser(prev => ({
            ...prev,
            theme: prev.theme === 'light' ? 'dark' : 'light'
        }));
    };

const [activeCourses, setActiveCourses] = useState<ActiveCourse[]>(mockActiveCourses);

    const themeStyles = {
        dashboardContainer: {
            ...styles.dashboardContainer,
            backgroundColor: user.theme === 'dark' ? colors.darkBackground : colors.background,
            color: user.theme === 'dark' ? colors.darkTextPrimary : colors.textPrimary,
        },
        card: {
            ...styles.card,
            backgroundColor: user.theme === 'dark' ? colors.darkCardBg : colors.cardBg,
            color: user.theme === 'dark' ? colors.darkTextPrimary : colors.textPrimary,
            borderColor: user.theme === 'dark' ? colors.darkBorder : colors.border,
        },
        header: {
            ...styles.header,
            backgroundColor: user.theme === 'dark' ? colors.darkCardBg : colors.cardBg,
            borderColor: user.theme === 'dark' ? colors.darkBorder : colors.border,
        },
        footer: {
            ...styles.footer,
            backgroundColor: user.theme === 'dark' ? colors.darkCardBg : colors.cardBg,
            borderColor: user.theme === 'dark' ? colors.darkBorder : colors.border,
        },
        sectionTitle: {
            ...styles.sectionTitle,
            color: user.theme === 'dark' ? colors.darkTextPrimary : colors.textPrimary,
        },
        sidebarTitle: {
            ...styles.sidebarTitle,
            color: user.theme === 'dark' ? colors.darkTextPrimary : colors.textPrimary,
        },
        textSecondary: {
            color: user.theme === 'dark' ? colors.darkTextSecondary : colors.textSecondary,
        },
        continueButton: {
            backgroundColor: user.theme === 'dark' ? colors.darkCardBg : colors.textLight,
            color: user.theme === 'dark' ? colors.darkTextPrimary : colors.primaryBlue,
        },
    };


  return (
    <div style={themeStyles.dashboardContainer}>
      <Header 
        user={user} 
        toggleTheme={toggleTheme} 
        themeStyles={themeStyles}
        unreadNotifications={unreadNotificationsCount}
        notifications={notifications}
        onNotificationClick={handleNotificationRead}
        isMobile={isMobile}
      />
      <ToastContainer 
        notifications={toastNotifications} 
        themeStyles={themeStyles}
        onDismiss={dismissToast}
      />
      <main style={{...styles.mainGrid, ...responsiveStyles.mainGrid}}>
                {/* Main Content Column */}
                <div style={styles.mainContent}>
                    <ContinueLearningCard 
                    lastLesson={lastViewedLesson}
                    responsiveStyles={responsiveStyles}
                    themeStyles={themeStyles}
                    onContinue={() => {
                        const courseToContinue = activeCourses.find(c => c.title === lastViewedLesson.courseTitle);
                        
                        if (courseToContinue) {
                        const courseDetails = mockCourseDetailsMap[courseToContinue.id] || {
                            ...{}, 
                            id: courseToContinue.id,
                            title: courseToContinue.title,
                            progress: courseToContinue.progress
                        };
                        
                        setSelectedCourse(courseDetails);
                        setShowCourseDetails(true);
                        }
                    }}
                    />
                    <h3 style={themeStyles.sectionTitle}>Your Active Courses</h3>
                        <div style={styles.activeCoursesContainer}>
                            <div style={{...styles.activeCoursesGrid, ...responsiveStyles.activeCoursesGrid}}>                            {activeCourses.length > 0 ? (
                                activeCourses.map(course => (
                                    <ActiveCourseCard 
                                        key={course.id} 
                                        course={course} 
                                        themeStyles={themeStyles} 
                                        onRemove={handleRemoveCourse}
                                        onCourseSelect={(course) => {
                                            const courseDetails = mockCourseDetailsMap[course.id] || {
                                            ...{}, 
                                            id: course.id,
                                            title: course.title,
                                            progress: course.progress
                                            };
                                            
                                            setSelectedCourse(courseDetails);
                                            setShowCourseDetails(true);
                                            
                                            setLastViewedLesson({
                                            courseTitle: course.title,
                                            lessonTitle: course.module
                                            });
                                        }}
                                    />
                                ))
                            ) : (
                                <div style={{ 
                                    ...themeStyles.card, 
                                    gridColumn: '1 / -1',
                                    textAlign: 'center',
                                    padding: '2rem'
                                }}>
                                    <p style={{ color: themeStyles.textSecondary.color }}>
                                        No active courses at the moment
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showCourseDetails && selectedCourse && (
                    <CourseDetailsPanel 
                        course={selectedCourse}
                        themeStyles={themeStyles}
                        onClose={() => setShowCourseDetails(false)}
                        onLessonSelect={(lessonId) => {
                        const module = selectedCourse.modules.find(m => 
                            m.lessons.some(l => l.id === lessonId)
                        );
                        const lesson = module?.lessons.find(l => l.id === lessonId);
                        
                        if (module && lesson) {
                            setVideoPlayer({
                            isOpen: true,
                            currentLesson: {
                                title: lesson.title,
                                courseTitle: selectedCourse.title,
                                moduleTitle: module.title,
                                duration: lesson.duration
                            }
                            });
                            
                            setLastViewedLesson({
                            courseTitle: selectedCourse.title,
                            lessonTitle: `${module.title}: ${lesson.title}`
                            });
                            
                            showToast(`Starting lesson: ${lesson.title}`, 'info');
                        }
                        }}
                    />
                )}

                {/* Sidebar Column */}
                <aside style={styles.sidebar}>
                {!isMobile && (
                    <>
                    <ProfileSection user={user} themeStyles={themeStyles} />
                    <NotificationsSection 
                        notifications={notifications} 
                        themeStyles={themeStyles} 
                        onNotificationClick={handleNotificationRead}
                    />
                    </>
                )}
                <RecommendedCoursesSection 
                    courses={recommendedCourses} 
                    themeStyles={themeStyles}
                    onAddCourse={handleAddCourse}
                />
                </aside>
            </main>
            {videoPlayer.isOpen && (
            <VideoPlayer 
                lesson={videoPlayer.currentLesson} 
                themeStyles={themeStyles}
                onClose={() => setVideoPlayer({ isOpen: false, currentLesson: null })}
            />
            )}
            <Footer themeStyles={themeStyles} />
        </div>
    );
};

//================================================================================
// 6. STYLES (CSS-in-JS)
//================================================================================
const colors = {
    primaryBlue: '#1E40AF',
    primaryGreen: '#047857',
    background: '#F3F4F6',
    cardBg: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7281',
    textLight: '#F9FAFB',
    border: '#E5E7EB',
    ringBg: '#E5E7EB',
    darkBackground: '#1a202c',
    darkCardBg: '#2d3748',
    darkTextPrimary: '#f7fafc',
    darkTextSecondary: '#a0aec0',
    darkBorder: '#4a5568',
    notificationBlue: '#3B82F6',
};

const styles: { [key: string]: CSSProperties } = {
    // --- Layout ---
    dashboardContainer: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: colors.background,
        minHeight: '100vh',
        color: colors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        width: '100%', 
        overflowX: 'hidden' as 'hidden', 
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        padding: '1.5rem',
        maxWidth: '1400px',
        margin: '0 auto',
        flex: 1,  
        width: '100%',
        marginBottom: '2rem', 
    },
    mainContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    sectionTitle: {
        fontSize: '1.5rem',
        fontWeight: 600,
        color: colors.textPrimary,
        margin: '0 0 -0.5rem 0',
    },
    // --- Header ---
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        backgroundColor: colors.cardBg,
        borderBottom: `1px solid ${colors.border}`,
    },
    headerLogo: {
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: colors.primaryBlue,
        margin: 0,
    },
    headerWelcome: {
        fontSize: '1rem',
        fontWeight: 400,
        color: colors.textSecondary,
        margin: '0.25rem 0 0 0',
    },
    themeToggle: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
    },
    themeIcon: {
        width: '20px',
        height: '20px',
        color: colors.textSecondary,
    },
    headerProfile: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    bellIcon: {
        width: '24px',
        height: '24px',
        color: colors.textSecondary,
        cursor: 'pointer',
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    // --- Generic Card ---
    card: {
        backgroundColor: colors.cardBg,
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.3s ease',
        maxWidth: '100%', 
        boxSizing: 'border-box' 
    },
    // --- Continue Learning Card ---
    continueLearningCard: {
        backgroundColor: colors.primaryBlue,
        color: colors.textLight,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    continueSubtitle: {
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        opacity: 0.8,
        margin: '0 0 0.25rem 0',
    },
    continueCourseTitle: {
        fontSize: '1.5rem',
        fontWeight: 600,
        margin: 0,
    },
    continueLessonTitle: {
        fontSize: '1rem',
        opacity: 0.9,
        margin: '0.25rem 0 0 0',
    },
    continueButton: {
        backgroundColor: colors.textLight,
        color: colors.primaryBlue,
        border: 'none',
        borderRadius: '8px',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
    },
    // --- Active Courses ---
    activeCoursesGrid: {
        display: 'grid',
        width: '100%',
    },
    courseCardContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
    },
    courseInfo: {
        flex: 1,
    },
    courseTitle: {
        fontSize: '1.125rem',
        fontWeight: 600,
        margin: 0,
        paddingRight: '1.5rem',
    },
    courseModule: {
        fontSize: '0.875rem',
        color: colors.textSecondary,
        margin: '0.25rem 0 0.5rem 0',
    },
    courseDeadline: {
        fontSize: '0.875rem',
        color: colors.primaryGreen,
        fontWeight: 500,
        margin: 0,
    },
    // --- Progress Ring ---
    progressRingContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRingSvg: {
        transform: 'rotate(-90deg)',
    },
    progressRingIndicator: {
        transition: 'stroke-dashoffset 0.5s ease-out',
    },
    progressRingText: {
        position: 'absolute',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: colors.primaryGreen,
    },
    // --- Sidebar ---
    sidebarCard: {
      padding: '1.25rem',
    },
    sidebarTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      margin: '0 0 1rem 0',
      color: colors.textPrimary,
    },
    // --- Notifications ---
    notificationItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderBottom: `1px solid ${colors.border}`,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    },
    notificationDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: '6px',
    },
    notificationMessage: {
        fontSize: '0.875rem',
        margin: 0,
        lineHeight: 1.5,
    },
    notificationDate: {
        fontSize: '0.75rem',
        color: colors.textSecondary,
        margin: '0.25rem 0 0 0',
    },
    // --- Recommendations ---
    recommendHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
    },
    chevronIcon: {
        width: '24px',
        height: '24px',
        color: colors.textSecondary,
        transition: 'transform 0.3s ease',
    },
    recommendList: {
        marginTop: '1rem',
        animation: 'fadeIn 0.5s ease',
    },
    recommendItem: {
        padding: '0.75rem 0',
        borderTop: `1px solid ${colors.border}`,
    },
    recommendTitle: {
        fontSize: '1rem',
        fontWeight: 600,
        margin: '0 0 0.25rem 0',
    },
    recommendDesc: {
        fontSize: '0.875rem',
        color: colors.textSecondary,
        margin: 0,
        lineHeight: 1.5,
    },
    footer: {
        backgroundColor: colors.cardBg,
        borderTop: `1px solid ${colors.border}`,
        padding: '1.5rem',
        marginTop: 'auto', 
    },
    footerContent: {
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    footerText: {
        fontSize: '0.875rem',
        color: colors.textSecondary,
        margin: 0,
    },
    footerLinks: {
        display: 'flex',
        gap: '1.5rem',
    },
    footerLink: {
        fontSize: '0.875rem',
        color: colors.textSecondary,
        textDecoration: 'none',
        transition: 'color 0.2s ease',
    },
    bellButton: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
    },
    // Notification panel
    notificationPanel: {
        position: 'fixed',
        top: '80px',
        right: '1rem',
        width: 'calc(100% - 2rem)',
        maxWidth: '350px',
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'auto',
        borderRadius: '12px',
        zIndex: 1000,
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(255, 255, 255, 0.85)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    },
    notificationPanelContent: {
        padding: '0.5rem',
        overflowY: 'auto',
    },
    notificationPanelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.4rem 0.4rem',
        borderBottom: `1px solid ${colors.border}`,
        margin: '0 0.5rem',
    },
    accountPanelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.4rem 0.4rem',
        borderBottom: `1px solid ${colors.border}`,
        margin: '0 0.5rem',
    },
    notificationPanelClose: {
        background: 'transparent',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        color: 'inherit',
    },
    courseActions: {
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1rem',
    },
    courseButton: {
        border: 'none',
        borderRadius: '6px',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    removeButton: {
        background: 'transparent',
        border: 'none',
        color: colors.textSecondary,
        cursor: 'pointer',
        padding: '0.25rem', 
        position: 'absolute',
        top: '-0.5rem',
        right: '-0.5rem',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trashIcon: {
        width: '18px',  
        height: '18px',
        color: colors.textSecondary,
        transition: 'color 0.2s ease',
    },
    toastContainer: {
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        width: '90%',
        maxWidth: '500px',
    },
    toastNotification: {
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'slideDown 0.3s ease-out, fadeOut 0.5s ease 3s forwards',
    },
    toastIcon: {
        flexShrink: 0,
        width: '24px',
        height: '24px',
    },
    toastMessage: {
        margin: 0,
        fontSize: '0.9375rem',
        lineHeight: 1.4,
    },
    confirmationButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        marginTop: '0.5rem',
        width: '100%',
    },
    confirmButton: {
        backgroundColor: colors.textLight,
        border: 'none',
        borderRadius: '6px',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
        minWidth: '80px',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        color: colors.textLight,
        border: `1px solid ${colors.textLight}`,
        borderRadius: '6px',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
        minWidth: '80px',
    },
    addButton: {
        border: 'none',
        borderRadius: '6px',
        padding: '0.375rem 0.75rem',
        fontSize: '0.8125rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        marginLeft: '0.75rem',
    },
    moduleAccordion: {
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
    },
    moduleHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: colors.cardBg,
        cursor: 'pointer',
    },
    lessonItem: {
        padding: '0.75rem 1rem',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lessonCompleted: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    lessonLocked: {
        backgroundColor: colors.background,
        cursor: 'not-allowed',
        opacity: 0.7,
    },
    notificationScrollContainer: {
        maxHeight: '400px',
        overflowY: 'auto',
    },
    accountPanelContent: {
        padding: '1.5rem',
    },
    accountInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem 0',
    },
    accountName: {
        fontSize: '1.125rem',
        fontWeight: 600,
        textAlign: 'center',
    },
    accountActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem 0',
    },
    accountButton: {
        borderRadius: '8px',
        padding: '0.75rem',
        fontSize: '0.9375rem',
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'center',
        width: '100%',
        transition: 'all 0.2s ease',
        border: 'none',
    },
    notificationDotEmpty: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: '6px',
        border: '1px solid',
        backgroundColor: 'transparent',
    },
    videoControlButton: {
        background: 'transparent',
        border: 'none',
        color: colors.textLight,
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
    },
};

export default AnyLearningDashboard;