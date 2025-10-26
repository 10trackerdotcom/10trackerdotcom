"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";
import { 
  Search,
  Clock
} from "lucide-react";
import ArticlesSection from "./ArticlesSection";

// Define active exams - could be fetched from database in a real implementation
const ACTIVE_EXAMS = ["GATE-CSE", "IBPS-CLERK", "IBPS-PO"];

// Minimal icon placeholders (neutral)
const iconMap = {
  "CAT": "📘",
  "GATE-CSE": "💻",
  "JEE-MAIN": "📗",
  "NEET-(UG)": "📙",
  "UPSC": "📚",
  "GRE": "📕",
  "Bank PO": "📒",
  "SSC CGL": "📓"
};

// Skeleton components for loading state
const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
    <div className="h-4 bg-neutral-200 rounded w-16 mb-4"></div>
    <div className="h-5 bg-neutral-200 rounded w-3/5 mb-2"></div>
    <div className="h-4 bg-neutral-200 rounded w-4/5 mb-6"></div>
    <div className="h-9 bg-neutral-200 rounded"></div>
  </div>
);

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
  </div>
);

export default function ExamDashboard() {
  // State variables
  const [exams, setExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sortConfig, setSortConfig] = useState({ key: "popularity", direction: "desc" });
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState(null);
  const [statsData, setStatsData] = useState({
    totalExams: 0,
    totalMCQs: 0,
    activeExams: 0,
    comingSoonExams: 0
  });

  // Initialize Supabase client
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    setSupabase(supabaseClient);
  }, []);

  // Fetch exams data from Supabase
  useEffect(() => {
    const fetchExams = async () => {
      if (!supabase) return;

      try {
        setLoading(true);
        
        // Fetch category counts from Supabase using RPC
        const { data, error } = await supabase.rpc("get_category_counts");
        
        if (error) throw error;

        // Process and format the data
        const formattedExams = data.map(({ category, total_count, created_at = new Date().toISOString() }) => {
          const isActive = ACTIVE_EXAMS.includes(category);
          
          return {
            id: category.toLowerCase().replace(/\s+/g, "-"),
            name: category,
            count: total_count,
            countDisplay: total_count >= 1000 ? `${(total_count / 1000).toFixed(1)}k` : total_count,
            icon: iconMap[category] || "📚",
            status: isActive ? "active" : "coming-soon",
            description: `Comprehensive preparation for ${category} examination with practice tests and solutions`,
            created: created_at,
            lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
          };
        });

        setExams(formattedExams);
        
        // Update stats
        setStatsData({
          totalExams: formattedExams.length,
          totalMCQs: formattedExams.reduce((sum, exam) => sum + exam.count, 0),
          activeExams: formattedExams.filter(exam => exam.status === "active").length,
          comingSoonExams: formattedExams.filter(exam => exam.status === "coming-soon").length
        });
      } catch (error) {
        console.error("Error fetching exams:", error);
        toast.error("Failed to load exams data");
        
        // Fallback to mock data if Supabase fetch fails
        const mockExams = [
          { id: "cat", name: "CAT", count: 1500, countDisplay: "1.5k", status: "active" },
          { id: "gate-cse", name: "GATE-CSE", count: 1200, countDisplay: "1.2k", status: "active" },
          { id: "jee-main", name: "JEE-MAIN", count: 2000, countDisplay: "2.0k", status: "active" },
          { id: "neet-ug", name: "NEET-(UG)", count: 1800, countDisplay: "1.8k", status: "active" },
          { id: "upsc", name: "UPSC", count: 500, countDisplay: "500", status: "coming-soon" }
        ].map(exam => ({
          ...exam,
          icon: iconMap[exam.name] || "📚",
          description: `Comprehensive preparation for ${exam.name} examination with practice tests and solutions`,
          created: new Date().toISOString(),
          lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
        }));
        
        setExams(mockExams);
        setStatsData({
          totalExams: mockExams.length,
          totalMCQs: mockExams.reduce((sum, exam) => sum + exam.count, 0),
          activeExams: mockExams.filter(exam => exam.status === "active").length,
          comingSoonExams: mockExams.filter(exam => exam.status === "coming-soon").length
        });
      } finally {
        setLoading(false);
      }
    };

    if (supabase) {
      fetchExams();
    }
  }, [supabase]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    });
  };

  // Filtered and sorted exams using memoization
  const filteredAndSortedExams = useMemo(() => {
    // Filter exams
    let result = [...exams];
    
    if (searchQuery) {
      result = result.filter(exam => 
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(exam => exam.status === statusFilter);
    }

    // Sort exams
    result.sort((a, b) => {
      // First sort by status to keep active exams on top when sorting by status
      if (sortConfig.key === "status") {
        if (a.status === "active" && b.status !== "active") return sortConfig.direction === "asc" ? 1 : -1;
        if (a.status !== "active" && b.status === "active") return sortConfig.direction === "asc" ? -1 : 1;
      }

      // Then apply regular sorting
      if (["count", "popularity"].includes(sortConfig.key)) {
        return sortConfig.direction === "asc" 
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key];
      }
      
      if (["created", "lastUpdated"].includes(sortConfig.key)) {
        return sortConfig.direction === "asc"
          ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
          : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
      }
      
      // Default string comparison
      return sortConfig.direction === "asc"
        ? a[sortConfig.key].localeCompare(b[sortConfig.key])
        : b[sortConfig.key].localeCompare(a[sortConfig.key]);
    });

    return result;
  }, [exams, searchQuery, statusFilter, sortConfig]);

  // Handle exam card click
  const handleExamClick = (exam) => {
    if (exam.status === "active") {
      window.location.href = `/${exam.id}`;
    } else {
      toast.custom(
        (t) => (
          <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {exam.name} is coming soon!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    We&apos;re working hard to bring you this exam preparation. Join our waitlist to get notified!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    }
  };

  // Format date in a readable way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Minimal sort indicator (kept for potential future use)
  const SortIcon = () => null;

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        {/* <div className="relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-3 tracking-tight">
                Practice smarter. Learn faster.
              </h1>
              <p className="text-base md:text-lg text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                A clean, focused MCQ practice experience across top exams. No distractions—just results.
              </p>
            </motion.div>
          </div>
        </div> */}

        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          

           
          
          {/* Search and Filters */}
          {/* <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search exams"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 w-full text-neutral-800 placeholder-neutral-400 bg-white"
                />
              </div>
              
              <div className="md:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 text-neutral-800 bg-white"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="coming-soon">Coming soon</option>
                </select>
              </div>
              
              <div className="md:w-52">
                <select
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('-');
                    setSortConfig({ key, direction });
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 text-neutral-800 bg-white"
                >
                  <option value="count-desc">Most questions</option>
                  <option value="count-asc">Least questions</option>
                  <option value="name-asc">Name (A–Z)</option>
                  <option value="name-desc">Name (Z–A)</option>
                  <option value="lastUpdated-desc">Recently updated</option>
                </select>
              </div>
            </div>
          </div> */}
          
           
          
          {/* Exam Cards Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-16">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))
            ) : filteredAndSortedExams.length > 0 ? (
              filteredAndSortedExams.map((exam, index) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`bg-white rounded-xl border border-neutral-200 overflow-hidden ${
                    exam.status === "coming-soon" ? "opacity-90" : ""
                  } transition-all duration-200 hover:border-neutral-300 group`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-2xl">
                        {exam.icon}
                      </div>
                      <div className="px-2.5 py-1 rounded-full text-xs font-medium border border-neutral-300 text-neutral-700">
                        {exam.status === "active" ? `${exam.countDisplay} MCQs` : "Coming soon"}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">
                      {exam.name}
                    </h3>
                    <p className="text-neutral-600 text-sm mb-5 leading-relaxed line-clamp-2">
                      {exam.description}
                    </p>
                    
                    <div className="flex items-center text-xs text-neutral-500 mb-5">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      <span>Updated {formatDate(exam.lastUpdated)}</span>
                    </div>
                    
                    <button
                      onClick={() => handleExamClick(exam)}
                      className="w-full py-2.5 rounded-lg font-medium text-center transition-colors duration-150 border border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                    >
                      {exam.status === "active" ? "Start practice" : "Notify me"}
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-16 text-center"
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-3xl mb-5">
                  🔍
                </div>
                <h3 className="text-xl font-medium text-neutral-800 mb-2">
                  No matching exams found
                </h3>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  Try adjusting your search terms or filters to find what you&apos;re looking for
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="px-5 py-2.5 border border-neutral-300 text-neutral-800 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
                >
                  Reset Filters
                </button>
              </motion.div>
            )}
          </div> */}
          {/* Articles Section */}
          <ArticlesSection />

          {/* Subtle CTA Section */}
           
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}