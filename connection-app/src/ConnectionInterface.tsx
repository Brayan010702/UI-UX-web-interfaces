import React, { useState, useEffect, useRef, memo, useMemo } from "react"; // Import memo and useMemo

import {
  MapPinIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronLeftIcon,
  HeartIcon,
  MusicalNoteIcon,
  BookOpenIcon,
  CameraIcon,
  PuzzlePieceIcon,
  BoltIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/solid";

export const Coffee = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 8h2a3 3 0 0 1 0 6h-2" />
    <path d="M3 8h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8z" />
    <path d="M6 1v2" />
    <path d="M10 1v2" />
    <path d="M14 1v2" />
  </svg>
);

interface User {
  id: string;
  name: string;
  age: number;
  avatar: string;
  bio: string;
  interests: string[];
  location: { lat: number; lng: number };
  distance: number;
  lastMessage?: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isSender: boolean;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Alex Rivera",
    age: 25,
    avatar: "https://i.pravatar.cc/150?img=1",
    bio: "Coffee enthusiast, indie music lover, and weekend photographer",
    interests: ["coffee", "music", "photography"],
    location: { lat: 40.7128, lng: -74.006 },
    distance: 0.5,
    lastMessage: "Hey! Want to grab coffee tomorrow?",
    isOnline: true,
  },
  {
    id: "2",
    name: "Sam Chen",
    age: 28,
    avatar: "https://i.pravatar.cc/150?img=2",
    bio: "Fitness junkie and gaming nerd. Love trying new recipes!",
    interests: ["fitness", "gaming", "cooking"],
    location: { lat: 40.726, lng: -73.9897 },
    distance: 1.2,
    lastMessage: "That workout was intense! 💪",
    isOnline: true,
  },
  {
    id: "3",
    name: "Jordan Taylor",
    age: 23,
    avatar: "https://i.pravatar.cc/150?img=3",
    bio: "Artist by day, bookworm by night. Always up for adventures!",
    interests: ["art", "books", "photography"],
    location: { lat: 40.718, lng: -74.012 },
    distance: 0.8,
    lastMessage: "Have you read the new Murakami?",
    isOnline: false,
  },
  {
    id: "4",
    name: "Casey Morgan",
    age: 26,
    avatar: "https://i.pravatar.cc/150?img=4",
    bio: "Music producer and coffee addict. Let's jam!",
    interests: ["music", "coffee", "gaming"],
    location: { lat: 40.706, lng: -74.0088 },
    distance: 1.5,
    isOnline: true,
  },
  {
    id: "5",
    name: "Riley Kim",
    age: 24,
    avatar: "https://i.pravatar.cc/150?img=5",
    bio: "Yoga instructor and health food enthusiast",
    interests: ["fitness", "cooking", "art"],
    location: { lat: 40.7282, lng: -73.9942 },
    distance: 2.0,
    isOnline: false,
  },
];

const initialMockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "1",
      text: "Hey! I saw you like indie music too!",
      timestamp: new Date("2024-01-15T10:00:00"),
      isSender: false,
    },
    {
      id: "2",
      text: "Yes! Have you heard the new Arctic Monkeys album?",
      timestamp: new Date("2024-01-15T10:05:00"),
      isSender: true,
    },
    {
      id: "3",
      text: "It's amazing! We should go to their concert next month",
      timestamp: new Date("2024-01-15T10:10:00"),
      isSender: false,
    },
    {
      id: "4",
      text: "Hey! Want to grab coffee tomorrow?",
      timestamp: new Date("2024-01-15T14:00:00"),
      isSender: false,
    },
  ],
  "2": [
    {
      id: "1",
      text: "Just finished a 5k run!",
      timestamp: new Date("2024-01-15T08:00:00"),
      isSender: false,
    },
    {
      id: "2",
      text: "Nice! What was your time?",
      timestamp: new Date("2024-01-15T08:30:00"),
      isSender: true,
    },
    {
      id: "3",
      text: "That workout was intense! 💪",
      timestamp: new Date("2024-01-15T16:00:00"),
      isSender: false,
    },
  ],
  "3": [
    {
      id: "1",
      text: "Have you read the new Murakami?",
      timestamp: new Date("2024-01-15T19:00:00"),
      isSender: false,
    },
  ],
};

const interestIcons: Record<string, React.ReactNode> = {
  coffee: <Coffee className="w-4 h-4" />,
  music: <MusicalNoteIcon className="w-4 h-4" />,
  books: <BookOpenIcon className="w-4 h-4" />,
  photography: <CameraIcon className="w-4 h-4" />,
  gaming: <PuzzlePieceIcon className="w-4 h-4" />,
  fitness: <BoltIcon className="w-4 h-4" />,
  art: <PaintBrushIcon className="w-4 h-4" />,
  cooking: <HeartIcon className="w-4 h-4" />,
};

const interestColors: Record<string, string> = {
  coffee: "bg-amber-500",
  music: "bg-purple-500",
  books: "bg-blue-500",
  photography: "bg-pink-500",
  gaming: "bg-green-500",
  fitness: "bg-red-500",
  art: "bg-indigo-500",
  cooking: "bg-orange-500",
};

// --- START: Extracted Components ---

const UserCard = ({
  user,
  selectedUser,
  isMobile,
  setSelectedUser,
  setShowDetail,
}: {
  user: User;
  selectedUser: User | null;
  isMobile: boolean;
  setSelectedUser: (user: User | null) => void;
  setShowDetail: (show: boolean) => void;
}) => (
  <div
    className={`relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all cursor-pointer px-2 py-4 sm:px-6 sm:py-5 border group overflow-hidden
      border-slate-100
    `}
    onClick={() => {
      setSelectedUser(user);
      if (isMobile) setShowDetail(true);
    }}
    tabIndex={0}
    role="button"
    onKeyPress={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        setSelectedUser(user);
        if (isMobile) setShowDetail(true);
      }
    }}
  >

    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b opacity-70 group-hover:opacity-100 transition-all rounded-l-2xl" />

    {selectedUser?.id === user.id && (
      <div className="absolute left-0 top-0 h-full w-2 bg-cyan-500 rounded-l-2xl shadow-lg z-10 transition-all" />
    )}
    <div className="flex items-start space-x-5">
      <div className="relative">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
        />
        {user.isOnline && (
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-1">
            {user.name}, <span className="text-cyan-600">{user.age}</span>
          </h3>
          <span className="text-xs text-gray-400 flex items-center font-medium">
            <MapPinIcon className="w-3 h-3 mr-1" />
            {user.distance} mi
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{user.bio}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {user.interests.map((interest) => (
            <span
              key={interest}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${interestColors[interest]} text-white shadow-sm`}
            >
              {interestIcons[interest]}
              <span className="ml-1">{interest}</span>
            </span>
          ))}
        </div>
        {user.lastMessage && (
          <div className="mt-4 flex items-center text-xs text-gray-400">
            <ChatBubbleLeftIcon className="w-4 h-4 mr-1 text-cyan-400" />
            <p className="truncate">{user.lastMessage}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);


const DetailView = ({
  selectedUser,
  setShowDetail,
  setSelectedUser,
  messages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  filteredUsers, 
}: {
  selectedUser: User | null;
  isMobile: boolean;
  setShowDetail: (show: boolean) => void;
  setSelectedUser: (user: User | null) => void;
  messages: Record<string, Message[]>;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  handleSendMessage: () => void;
  filteredUsers: User[]; // Add this prop
}) => {

  const messagesEndRef = useRef<HTMLDivElement>(null);


  const userMessages = useMemo(() => {
    return selectedUser ? messages[selectedUser.id] || [] : [];
  }, [selectedUser, messages]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userMessages]);

  
  if (!selectedUser || !filteredUsers.some((u) => u.id === selectedUser.id))
    return null;

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100">
      <div className="bg-gradient-to-r from-cyan-600 via-slate-600 to-slate-800 text-white p-6 rounded-t-2xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setShowDetail(false);
              setSelectedUser(null);
            }}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => setSelectedUser(null)}
            className="hidden md:block p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <img
            src={selectedUser.avatar}
            alt={selectedUser.name}
            className="w-20 h-20 rounded-full border-4 border-white/30 shadow"
          />
          <div>
            <h2 className="text-2xl font-bold">
              {selectedUser.name}, {selectedUser.age}
            </h2>
            <p className="text-white/80">{selectedUser.bio}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-2">Shared Interests</h3>
          <div className="flex flex-wrap gap-2">
            {selectedUser.interests.map((interest) => (
              <span
                key={interest}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm text-white ${interestColors[interest]} shadow-sm`}
              >
                {interestIcons[interest]}
                <span className="ml-1">{interest}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Recent Messages</h3>
          {userMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isSender ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                  message.isSender
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.isSender ? "text-cyan-100" : "text-gray-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> 
        </div>
      </div>

      {/* Message Input and Send Button */}
      <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex flex-col items-stretch space-y-2">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
          placeholder="Type your message..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button
          onClick={handleSendMessage}
          className="bg-gradient-to-r from-cyan-600 to-slate-700 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all w-full"
          style={{ minWidth: 80, maxWidth: "100%" }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const MemoizedDetailView = memo(DetailView);

// --- END: Extracted Components ---

export default function ConnectionInterface() {
  const [users] = useState<User[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] =
    useState<Record<string, Message[]>>(initialMockMessages);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedUser) {
        setSelectedUser(null);
        setShowDetail(false);
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = users.findIndex((u) => u.id === selectedUser?.id);
        if (e.key === "ArrowDown" && currentIndex < users.length - 1) {
          setSelectedUser(users[currentIndex + 1]);
        } else if (e.key === "ArrowUp" && currentIndex > 0) {
          setSelectedUser(users[currentIndex - 1]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [selectedUser, users]);

  useEffect(() => {
    const id = "manrope-font-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
    const styleId = "manrope-font-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        .font-manrope {
          font-family: 'Manrope', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchEnd - touchStart;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && showDetail) {
        // Swipe right to close detail
        setShowDetail(false);
        setSelectedUser(null);
      } else if (diff < 0 && !showDetail) {
        // Swipe left to open detail
        if (selectedUser) setShowDetail(true);
      }
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSendMessage = () => {
    if (selectedUser && currentMessage.trim() !== "") {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: currentMessage.trim(),
        timestamp: new Date(),
        isSender: true,
      };

      setMessages((prevMessages) => ({
        ...prevMessages,
        [selectedUser.id]: [
          ...(prevMessages[selectedUser.id] || []),
          newMessage,
        ],
      }));
      setCurrentMessage("");
    }
  };

  const filteredUsers =
    selectedInterests.length > 0
      ? users.filter((user) =>
          user.interests.some((i) => selectedInterests.includes(i))
        )
      : users;

  const MapView = () => {
    return (
      <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-xl border border-slate-100">
        {/* Mock map background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://tile.openstreetmap.org/10/301/385.png"
            alt="Mock map"
            className="w-full h-full object-cover opacity-80"
            draggable={false}
          />
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
        </div>
        {filteredUsers.map((user, idx, arr) => {

          const radius = 32;
          const centerX = 50;
          const centerY = 50;
          const angle = (2 * Math.PI * idx) / arr.length;
          const left = centerX + radius * Math.cos(angle);
          const top = centerY + radius * Math.sin(angle);
          return (
            <div
              key={user.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-105"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              onClick={() => {
                setSelectedUser(user);
                if (isMobile) setShowDetail(true);
              }}
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`w-12 h-12 rounded-full border-4 ${
                    user.isOnline ? "border-cyan-400" : "border-gray-200"
                  } shadow-md`}
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                  <MapPinIcon className="w-3 h-3 text-cyan-600" />
                </div>
              </div>
            </div>
          );
        })}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-4 py-2 shadow border border-slate-100 z-10">
          <p className="text-sm font-semibold text-gray-700 md:block hidden">
            Nearby Connections
          </p>
          <p className="text-xs text-gray-400">
            {filteredUsers.length} people near you
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="font-manrope min-h-screen relative overflow-x-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-100 via-slate-200 to-gray-200" />
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-100 via-slate-100 to-transparent opacity-30 blur-2xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-slate-200 via-cyan-100 to-transparent opacity-30 blur-2xl" />
        <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-white/50 via-transparent to-white/10" />
        <div className="absolute -top-24 right-0 w-[250px] h-[250px] rounded-full bg-gradient-to-bl from-blue-100 via-blue-50 to-transparent opacity-20 blur-2xl" />
        <div className="absolute bottom-0 -left-40 w-[250px] h-[180px] rounded-full bg-gradient-to-tr from-pink-100 via-pink-50 to-transparent opacity-10 blur-2xl" />
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          style={{ pointerEvents: "none" }}
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-2 border-cyan-100 opacity-10" />
      </div>
      <div className="max-w-7xl mx-auto p-4">        
        <header className="mb-6 rounded-2xl shadow bg-gradient-to-r from-cyan-700 via-slate-700 to-slate-900 px-8 py-6 flex flex-col sm:flex-row items-center justify-between border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">
              Discover Connections
            </h1>
            <p className="text-slate-200 mt-1 font-medium">
              Find people nearby who share your interests
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <span className="inline-flex items-center bg-white/10 text-white px-4 py-2 rounded-lg font-semibold shadow border border-white/20">
              <MapPinIcon className="w-5 h-5 mr-2 text-cyan-200" />
              <span>NYC Area</span>
            </span>
          </div>
        </header>

        <div className="mb-4 flex flex-row items-start gap-4 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0 flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow border border-slate-100 hover:shadow-lg transition-all cursor-pointer w-full sm:w-auto"
            style={{ minWidth: 180, height: 48 }}
          >
            <FunnelIcon className="w-5 h-5 text-cyan-700" />
            <span className="font-medium">Filter Interests</span>
          </button>
          {showFilters && (
            <div
              className="bg-white rounded-lg shadow border border-slate-100 flex-1 min-w-0 flex items-center w-full"
              style={{
                height: "auto",
                padding: 0,
                minHeight: 48,
              }}
            >
              <div
                className={`
                  w-full px-2 sm:px-4 gap-2
                  grid
                  grid-cols-4
                  sm:grid-cols-5
                  md:grid-cols-6
                  lg:grid-cols-8
                `}
                style={{
                  rowGap: 8,
                  minWidth: 0,
                  minHeight: 0,
                  height: "auto",
                }}
              >
                <style>
                  {`
                    @media (max-width: 639px) {
                      .mobile-interest-container {
                        min-height: 260px !important;
                        height: auto !important;
                      }
                      .hide-mobile-label {
                        display: none !important;
                      }
                      .mobile-interest-padding {
                        padding-left: 4px !important;
                        padding-right: 4px !important;
                      }
                    }
                  `}
                </style>
                <div className="mobile-interest-container mobile-interest-padding contents">
                  {Object.keys(interestIcons).map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`flex items-center justify-center w-full sm:py-1 rounded-full text-sm transition-all cursor-pointer ${
                        selectedInterests.includes(interest)
                          ? `${interestColors[interest]} text-white shadow`
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      style={{ minWidth: 0, whiteSpace: "nowrap" }}
                    >
                      {interestIcons[interest]}
                      <span className="ml-1 hide-mobile-label">{interest}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <MapView />
        </div>

        <div className="grid md:grid-cols-2 gap-8 border border-slate-200 rounded-3xl shadow-2xl bg-white/80 p-2 sm:p-4 md:p-10 lg:p-12 transition-all duration-300">
          <div
            ref={listRef}
            className={`space-y-4 ${isMobile && showDetail ? "hidden" : ""}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                selectedUser={selectedUser}
                isMobile={isMobile}
                setSelectedUser={setSelectedUser}
                setShowDetail={setShowDetail}
              />
            ))}
          </div>

          <div
            ref={detailRef}
            className={`${
              isMobile
                ? `fixed inset-0 z-50 bg-gray-50 p-4 transition-transform duration-300 ${
                    showDetail ? "translate-x-0" : "translate-x-full"
                  }`
                : ""
            }`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={
              isMobile && showDetail
                ? undefined
                : isMobile && !showDetail
                ? {
                    transform: "translateX(100%)",
                    transition: "transform 0.3s",
                  }
                : undefined
            }
          >
            {(selectedUser || isMobile) && (
              <MemoizedDetailView 
                selectedUser={selectedUser}
                isMobile={isMobile}
                setShowDetail={setShowDetail}
                setSelectedUser={setSelectedUser}
                messages={messages}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                handleSendMessage={handleSendMessage}
                filteredUsers={filteredUsers} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}