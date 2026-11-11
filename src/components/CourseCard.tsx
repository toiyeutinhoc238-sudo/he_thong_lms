import React from 'react';
import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { BookOpen, User, CheckCircle, Clock, ChevronRight, Award } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { navigateToCourse } = useApp();

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'student_regular':
        return { label: 'Chính quy', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'teacher_training':
        return { label: 'Bồi dưỡng GV', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'community':
        return { label: 'Cộng đồng / SHCD', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'internal':
        return { label: 'Nội bộ', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: 'Học phần', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const badge = getCategoryBadge(course.category);

  return (
    <div 
      onClick={() => navigateToCourse(course.id)}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-hcmue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group"
    >
      <div>
        {/* Course Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <img 
            src={course.thumbnail} 
            alt={course.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border backdrop-blur-xs ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono rounded-md">
              {course.code}
            </span>
          </div>

          {/* Credits / Semester pill */}
          <div className="absolute bottom-3 left-3 text-white text-xs font-medium flex items-center gap-2">
            <span className="bg-hcmue-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
              {course.credits > 0 ? `${course.credits} Tín chỉ` : 'Bắt buộc'}
            </span>
            <span className="text-slate-200 text-[11px]">
              {course.semester}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base line-clamp-2 group-hover:text-hcmue-700 transition-colors">
            {course.name}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <img 
              src={course.instructor.avatar} 
              alt={course.instructor.name}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200" 
            />
            <span className="truncate font-medium">{course.instructor.name}</span>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>
      </div>

      {/* Progress & Action Footer */}
      <div className="p-4 pt-0 border-t border-slate-100 mt-2">
        <div className="pt-3 space-y-2">
          {/* Progress Bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Tiến độ học tập</span>
            <span className={`font-bold ${course.progress === 100 ? 'text-emerald-600' : 'text-hcmue-700'}`}>
              {course.progress}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                course.progress === 100 
                  ? 'bg-emerald-500' 
                  : 'bg-gradient-to-r from-hcmue-600 to-hcmue-500'
              }`}
              style={{ width: `${course.progress}%` }}
            />
          </div>

          {/* Bottom Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {course.completedActivities}/{course.totalActivities} hoạt động
            </span>

            <button className="flex items-center gap-1 text-xs font-bold text-hcmue-700 group-hover:text-hcmue-900 group-hover:translate-x-1 transition-all">
              <span>{course.progress === 100 ? 'Xem lại' : course.progress > 0 ? 'Học tiếp' : 'Vào lớp'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

