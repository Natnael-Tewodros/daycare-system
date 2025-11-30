"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play as PlayIcon,
  X,
  FileText,
  Utensils,
  HeartHandshake,
  Stethoscope,
  CheckCircle,
  GraduationCap,
  Gamepad2,
  Bed,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Room {
  id: string;
  name: string;
  ageRange: string;
  current: number;
  max: number;
  color: string;
  icon: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

const getRoomIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("infant")) return "👶";
  if (lowerName.includes("toddler")) return "🧸";
  if (lowerName.includes("growing")) return "🌱";
  return "🎓";
};

const getRoomColor = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("infant"))
    return "bg-sky-50 text-sky-600 border-sky-100";
  if (lowerName.includes("toddler"))
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (lowerName.includes("growing"))
    return "bg-violet-50 text-violet-600 border-violet-100";
  return "bg-amber-50 text-amber-600 border-amber-100";
};

const services = [
  {
    Icon: Utensils,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    title: "Nutritious Meals",
    items: ["Daily fresh meals", "Dietary options", "Fresh produce"],
  },
  {
    Icon: Gamepad2,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    title: "Educational Games",
    items: ["Interactive play", "Arts & crafts", "Teamwork"],
  },
  {
    Icon: Bed,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    title: "Comfortable Rest",
    items: ["Personal nap areas", "Clean bedding", "Quiet time"],
  },
  {
    Icon: GraduationCap,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    title: "Life Skills",
    items: ["Self-care", "Communication", "Problem-solving"],
  },
  {
    Icon: Stethoscope,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Health Monitoring",
    items: ["Daily checks", "Medication", "First aid"],
  },
  {
    Icon: HeartHandshake,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
    title: "Emotional Support",
    items: ["1-on-1 care", "Positive guidance", "Confidence building"],
  },
];

const requirements = [
  {
    title: "Required Documents",
    Icon: FileText,
    color: "text-violet-600",
    bg: "bg-violet-50",
    items: [
      "Medical Report",
      "Birth Certificate",
      "Vaccination Records",
      "Parent/Guardian ID",
      "Emergency Contacts",
      "2 Passport Photos",
    ],
  },
  {
    title: "Personal Items",
    Icon: Utensils,
    color: "text-amber-600",
    bg: "bg-amber-50",
    items: [
      "Extra Clothes",
      "Blanket",
      "Diapers/Wipes",
      "Water Bottle",
      "Comfort Item",
      "Outerwear",
    ],
  },
];

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pendingEnrollmentRequests, setPendingEnrollmentRequests] = useState<
    any[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const images = [
    "/daycare1.jpg",
    "/daycare2.jpg",
    "/daycare3.jpg",
    "/daycare4.jpg",
  ];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rooms
        const roomsResponse = await fetch("/api/rooms");
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(
            roomsData.map((room: any) => ({
              id: room.id,
              name: room.name,
              ageRange: room.name?.toLowerCase().includes("growing")
                ? "2 years - 4 years"
                : room.ageRange || "All ages",
              current: room.childrenCount || 0,
              max: 30,
              color: getRoomColor(room.name),
              icon: getRoomIcon(room.name),
            }))
          );
        }

        // Fetch pending requests (store full objects so we can show details)
        const pendingResponse = await fetch(
          "/api/enrollment-requests?status=pending"
        );
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingEnrollmentRequests(pendingData?.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying || isFullscreen) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isFullscreen, images.length]);

  // Close fullscreen on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isFullscreen]);

  // Carousel functions
  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToImage = (index: number) => setCurrentImageIndex(index);
  const toggleAutoPlay = () => setIsAutoPlaying(!isAutoPlaying);
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) setIsAutoPlaying(false);
  };

  const RoomCard = ({ room }: { room: Room }) => {
    const percentage = Math.min(
      100,
      Math.round((room.current / room.max) * 100)
    );
    const availableSlots = Math.max(0, room.max - room.current);

    return (
      <Card className="bg-white border-slate-200 hover:border-slate-300 transition-all p-6 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md">
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${room.color
            .split(" ")[0]
            .replace("bg-", "from-")
            .replace("/10", "/5")} to-transparent rounded-bl-full opacity-50`}
        />

        <div className="relative z-10">
          <div
            className={`w-12 h-12 rounded-2xl ${room.color} flex items-center justify-center mb-6 text-2xl`}
          >
            {room.icon}
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">{room.name}</h3>
          <p className="text-slate-500 text-sm mb-6">{room.ageRange}</p>

          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {room.current}
                <span className="text-sm text-slate-500 font-normal">
                  /{room.max}
                </span>
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {availableSlots} slot{availableSlots !== 1 ? "s" : ""} available
              </div>
            </div>

            <div
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                percentage >= 100
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {percentage >= 100 ? "Full" : "Available"}
            </div>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                percentage >= 90 ? "bg-red-500" : "bg-indigo-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      <div className="relative z-10">
        <Navigation />

        {/* Hero Carousel */}
        <section className="relative h-screen w-full overflow-hidden">
          <div className="relative w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="relative w-full h-full"
              >
                <Image
                  src={images[currentImageIndex]}
                  alt={`Daycare Gallery ${currentImageIndex + 1}`}
                  fill
                  className="object-cover cursor-pointer"
                  priority
                  onClick={toggleFullscreen}
                />
                <div className="absolute inset-0 bg-black/20" />

                {/* Top Text Content */}
                <div className="absolute top-20 left-0 right-0 text-center text-white px-6">
                  <motion.h1
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl"
                  >
                    Welcome to Insa Daycare
                  </motion.h1>
                  <motion.p
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-lg md:text-xl drop-shadow-lg opacity-90"
                  >
                    Where every child's journey begins with love and learning
                  </motion.p>
                </div>

                {/* Controls Bar */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-4">
                  <button
                    onClick={toggleAutoPlay}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    {isAutoPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={prevImage}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-2 mx-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextImage}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="text-white text-sm font-medium ml-2">
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-amber-200 transition-colors ml-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Fullscreen Modal */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            >
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-60 text-white hover:text-amber-200 transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto"
                  >
                    <Image
                      src={images[currentImageIndex]}
                      alt={`Daycare Gallery ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-4">
                  <button
                    onClick={prevImage}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex gap-2 mx-4">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextImage}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="text-white text-sm font-medium ml-4 border-l border-white/30 pl-4">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room Availability */}
        <section
          id="room-availability"
          className="py-24 px-6 border-b border-slate-100"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Our Classrooms
              </h2>
              <p className="text-slate-600">
                We maintain small class sizes to ensure personalized attention
                for every child.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-64 bg-slate-100 rounded-2xl animate-pulse border border-slate-200"
                    />
                  ))
                : rooms.map((room) => <RoomCard key={room.id} room={room} />)}
            </div>
          </div>
        </section>

        {/* Pending Enrollment */}
        <section id="pending-enrollment" className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                New Enrollment Requests
              </h3>
              <p className="text-sm text-slate-500">
                Number of parents who have requested to join the daycare.
              </p>
            </div>

            <div className="max-w-md">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending requests
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {pendingEnrollmentRequests.length}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/enrollment-requests"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    View all
                  </Link>
                </div>

                {pendingEnrollmentRequests.length > 0 ? (
                  <ul className="mt-4 divide-y divide-slate-100">
                    {pendingEnrollmentRequests.slice(0, 5).map((r: any) => {
                      const created = r.createdAt
                        ? new Date(r.createdAt)
                        : null;
                      const preferred = r.preferredStartDate
                        ? new Date(r.preferredStartDate)
                        : null;
                      const isNew = created
                        ? Date.now() - created.getTime() < 1000 * 60 * 60 * 24
                        : false; // within 24 hours

                      return (
                        <li
                          key={r.id}
                          className="py-3 flex items-start justify-between"
                        >
                          <div>
                            <div className="font-medium text-slate-900">
                              {r.parentName}
                            </div>
                            <div className="text-sm text-slate-600">
                              {r.childName} • {r.childAge} yr
                              {r.childAge !== 1 ? "s" : ""}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {r.email}
                              {r.phone ? ` • ${r.phone}` : ""}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {preferred
                                ? `Preferred: ${preferred.toLocaleDateString()}`
                                : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            {isNew && (
                              <div className="mb-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                New
                              </div>
                            )}
                            <div className="text-xs text-slate-400">
                              {created ? created.toLocaleString() : ""}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {pendingEnrollmentRequests.length > 5 && (
                      <li className="py-2 text-sm text-slate-500 text-center">
                        Showing 5 of {pendingEnrollmentRequests.length}
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="mt-4 text-sm text-slate-500">
                    No pending enrollment requests.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 border-amber-200 bg-amber-50 text-amber-700"
              >
                <HeartHandshake className="w-3 h-3 mr-2" /> Our Services
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Comprehensive Childcare
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Everything your child needs for a balanced and happy
                development.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(({ Icon, color, bg, border, title, items }, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-slate-300 transition-colors shadow-sm hover:shadow-md"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-6 border ${border}`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {title}
                  </h3>
                  <ul className="space-y-3">
                    {items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-3 text-slate-600 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section
          id="requirements"
          className="py-24 px-6 border-t border-slate-100 bg-slate-50/50"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge
                variant="outline"
                className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                <FileText className="w-3 h-3 mr-2" /> Enrollment
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900">
                Enrollment Requirements
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {requirements.map(({ title, Icon, color, bg, items }, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}
                    >
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {title}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-medium text-slate-700 text-sm">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
