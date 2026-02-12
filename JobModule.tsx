
import React, { useState, useMemo } from 'react';
import { Search, Briefcase, MapPin, DollarSign, ExternalLink, Filter, Star, CheckCircle2, Map } from 'lucide-react';
import { UserProfile, JobRecommendation } from '../types';

const mockJobs: JobRecommendation[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'InnovateTech',
    location: 'Remote, USA',
    matchScore: 94,
    description: 'Looking for a React expert with 5+ years experience in building high-performance web applications...',
    link: 'https://example.com/apply/1'
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'GrowthStack',
    location: 'Austin, TX',
    matchScore: 82,
    description: 'Join our core engineering team to build scalable APIs using Node.js and modern frontend frameworks...',
    link: 'https://example.com/apply/2'
  },
  {
    id: '3',
    title: 'Frontend Architect',
    company: 'CloudFlow',
    location: 'New York, NY',
    matchScore: 78,
    description: 'Lead the architectural design of our new customer portal and mentor junior developers...',
    link: 'https://example.com/apply/3'
  },
  {
    id: '4',
    title: 'Python Backend Specialist',
    company: 'DataStream',
    location: 'San Francisco, CA',
    matchScore: 88,
    description: 'Deep dive into distributed systems and high-throughput data processing using Python and FastAPI.',
    link: 'https://example.com/apply/4'
  }
];

interface JobModuleProps {
  user: UserProfile;
  onGenerateRoadmap: (jobTitle: string) => void;
}

const JobModule: React.FC<JobModuleProps> = ({ user, onGenerateRoadmap }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return mockJobs;
    const term = searchTerm.toLowerCase();
    return mockJobs.filter(job => 
      job.title.toLowerCase().includes(term) || 
      job.company.toLowerCase().includes(term) ||
      job.description.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleApply = (jobId: string, link: string) => {
    setAppliedJobs(prev => new Set(prev).add(jobId));
    setTimeout(() => {
      window.open(link, '_blank');
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for job titles, companies or skills..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all">
          <Filter className="w-4 h-4" /> Filters
        </button>
        <button 
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          Find Jobs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Market Insights */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-indigo-500" />
              Market Demand
            </h4>
            <div className="space-y-4">
              {[
                { skill: 'React.js', demand: 'High', trend: '+12%' },
                { skill: 'TypeScript', demand: 'Very High', trend: '+24%' },
                { skill: 'AWS Cloud', demand: 'Medium', trend: '+5%' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{s.skill}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Demand: {s.demand}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {s.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold mb-2">Pro Career Tip</h4>
              <p className="text-sm text-indigo-100 mb-4">Adding "System Design" to your resume could increase your match score for Lead roles by up to 22%.</p>
              <button className="text-xs font-bold underline underline-offset-4">Learn More</button>
            </div>
            <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-indigo-500 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-900">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'Recommended for You'}
            </h3>
            <span className="text-sm text-slate-500 font-medium">Showing {filteredJobs.length} matches</span>
          </div>

          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group relative">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Briefcase className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                      <p className="text-sm font-medium text-slate-500">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-black">{job.matchScore}% Match</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                  <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> $120k - $160k</span>
                </div>

                <p className="text-sm text-slate-600 mb-6 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onGenerateRoadmap(job.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      <Map className="w-3.5 h-3.5" /> Prep Roadmap
                    </button>
                  </div>
                  
                  {appliedJobs.has(job.id) ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" /> Applied
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleApply(job.id, job.link)}
                      className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Quick Apply <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <p className="text-slate-500 font-medium">No jobs found matching your search criteria.</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-indigo-600 font-bold text-sm mt-2 hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TrendingUpIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);

export default JobModule;
