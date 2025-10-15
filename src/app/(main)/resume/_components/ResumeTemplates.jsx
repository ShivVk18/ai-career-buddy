
import React from "react";
import { Briefcase } from "lucide-react";

export const ModernProTemplate = ({ data, photo }) => (
  <div className="bg-white text-gray-900 p-8 min-h-[1100px] font-sans">
    <div className="grid grid-cols-3 gap-6">
      {/* Left sidebar */}
      <div className="col-span-1 bg-blue-50 p-6 rounded-lg">
        {photo && (
          <div className="mb-6">
            <img
              src={photo}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-blue-500"
            />
          </div>
        )}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3 border-b-2 border-blue-500 pb-2">
            Contact
          </h3>
          <div className="space-y-2 text-sm">
            {data.contactInfo?.email && (
              <p className="break-all">📧 {data.contactInfo.email}</p>
            )}
            {data.contactInfo?.mobile && <p>📱 {data.contactInfo.mobile}</p>}
            {data.contactInfo?.linkedin && (
              <p className="break-all text-blue-600">💼 LinkedIn</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-3 border-b-2 border-blue-500 pb-2">
            Skills
          </h3>
          <p className="text-sm whitespace-pre-wrap">{data.skills}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-2">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">
          {data.contactInfo?.fullName || "Your Name"}
        </h1>
        <p className="text-xl text-blue-600 mb-6">Professional Title</p>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-3 border-b-2 border-blue-500 pb-2">
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </div>

        {data.experience?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-3 border-b-2 border-blue-500 pb-2">
              Experience
            </h2>
            {data.experience.map((exp, idx) => (
              <div key={idx} className="mb-4">
                <h3 className="font-bold text-lg">{exp.title}</h3>
                <p className="text-blue-600 font-semibold">{exp.organization}</p>
                <p className="text-sm text-gray-600 mb-2">
                  {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                </p>
                <p className="text-sm whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {data.education?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-3 border-b-2 border-blue-500 pb-2">
              Education
            </h2>
            {data.education.map((edu, idx) => (
              <div key={idx} className="mb-3">
                <h3 className="font-bold">{edu.title}</h3>
                <p className="text-blue-600">{edu.organization}</p>
                <p className="text-sm text-gray-600">
                  {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const MinimalClassicTemplate = ({ data }) => (
  <div className="bg-white text-gray-900 p-12 min-h-[1100px] font-serif">
    <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
      <h1 className="text-4xl font-bold mb-2">{data.contactInfo?.fullName || "YOUR NAME"}</h1>
      <div className="flex justify-center gap-4 text-sm flex-wrap">
        {data.contactInfo?.email && <span>{data.contactInfo.email}</span>}
        {data.contactInfo?.mobile && <span>{data.contactInfo.mobile}</span>}
      </div>
    </div>

    <div className="mb-6">
      <h2 className="text-xl font-bold uppercase mb-3 border-b border-gray-400">Summary</h2>
      <p className="text-sm leading-relaxed">{data.summary}</p>
    </div>

    {data.experience?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-xl font-bold uppercase mb-3 border-b border-gray-400">Experience</h2>
        {data.experience.map((exp, idx) => (
          <div key={idx} className="mb-4">
            <div className="flex justify-between items-baseline flex-wrap">
              <h3 className="font-bold text-base">{exp.title}</h3>
              <span className="text-sm text-gray-600">
                {exp.startDate} - {exp.current ? "Present" : exp.endDate}
              </span>
            </div>
            <p className="italic text-gray-700">{exp.organization}</p>
            <p className="text-sm mt-2 whitespace-pre-wrap">{exp.description}</p>
          </div>
        ))}
      </div>
    )}

    <div className="mb-6">
      <h2 className="text-xl font-bold uppercase mb-3 border-b border-gray-400">Skills</h2>
      <p className="text-sm whitespace-pre-wrap">{data.skills}</p>
    </div>

    {data.education?.length > 0 && (
      <div>
        <h2 className="text-xl font-bold uppercase mb-3 border-b border-gray-400">Education</h2>
        {data.education.map((edu, idx) => (
          <div key={idx} className="mb-3">
            <div className="flex justify-between items-baseline flex-wrap">
              <h3 className="font-bold">{edu.title}</h3>
              <span className="text-sm text-gray-600">
                {edu.startDate} - {edu.current ? "Present" : edu.endDate}
              </span>
            </div>
            <p className="italic text-gray-700">{edu.organization}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const CreativeBoldTemplate = ({ data, photo }) => (
  <div className="bg-gradient-to-br from-purple-50 to-pink-50 text-gray-900 p-8 min-h-[1100px]">
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <div className="grid grid-cols-2 gap-8">
        <div>
          {photo && (
            <img
              src={photo}
              alt="Profile"
              className="w-48 h-48 rounded-2xl object-cover mb-6 shadow-lg"
            />
          )}
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {data.contactInfo?.fullName || "YOUR NAME"}
          </h1>
          <p className="text-2xl text-purple-600 font-bold mb-6">Creative Professional</p>
          
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-purple-800 mb-3">Summary</h2>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </div>

          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-purple-800 mb-3">Contact</h2>
            <div className="text-sm space-y-2">
              {data.contactInfo?.email && <p>{data.contactInfo.email}</p>}
              {data.contactInfo?.mobile && <p>{data.contactInfo.mobile}</p>}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center">
              <Briefcase className="mr-2" /> Experience
            </h2>
            {data.experience?.length > 0 ? (
              data.experience.map((exp, idx) => (
                <div key={idx} className="mb-4 bg-purple-50 rounded-xl p-4">
                  <h3 className="font-bold text-lg text-purple-900">{exp.title}</h3>
                  <p className="text-purple-600 font-semibold">{exp.organization}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </p>
                  <p className="text-sm">{exp.description}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No experience added yet</p>
            )}
          </div>

          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-purple-800 mb-3">Skills</h2>
            <p className="text-sm whitespace-pre-wrap">{data.skills}</p>
          </div>

          {data.education?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-purple-800 mb-3">Education</h2>
              {data.education.map((edu, idx) => (
                <div key={idx} className="mb-3 bg-purple-50 rounded-xl p-3">
                  <h3 className="font-bold">{edu.title}</h3>
                  <p className="text-purple-600">{edu.organization}</p>
                  <p className="text-sm text-gray-600">
                    {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const ExecutiveEliteTemplate = ({ data, photo }) => (
  <div className="bg-gradient-to-b from-emerald-900 to-gray-900 text-white p-8 min-h-[1100px]">
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-1 bg-emerald-800/30 backdrop-blur-sm rounded-lg p-6">
        {photo && (
          <img
            src={photo}
            alt="Profile"
            className="w-full aspect-square rounded-lg object-cover mb-6 border-2 border-emerald-400"
          />
        )}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-emerald-300 mb-2 uppercase tracking-wider">
              Contact
            </h3>
            <div className="text-xs space-y-1">
              {data.contactInfo?.email && <p className="break-all">{data.contactInfo.email}</p>}
              {data.contactInfo?.mobile && <p>{data.contactInfo.mobile}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-300 mb-2 uppercase tracking-wider">
              Core Skills
            </h3>
            <p className="text-xs whitespace-pre-wrap">{data.skills}</p>
          </div>
        </div>
      </div>

      <div className="col-span-3">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2">{data.contactInfo?.fullName || "EXECUTIVE NAME"}</h1>
          <p className="text-2xl text-emerald-400">Senior Leadership Professional</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">Executive Summary</h2>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </div>

        {data.experience?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">Professional Experience</h2>
            {data.experience.map((exp, idx) => (
              <div key={idx} className="mb-4 bg-white/5 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-bold text-xl">{exp.title}</h3>
                <p className="text-emerald-300 font-semibold">{exp.organization}</p>
                <p className="text-sm text-gray-400 mb-2">
                  {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                </p>
                <p className="text-sm">{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {data.education?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">Education</h2>
            {data.education.map((edu, idx) => (
              <div key={idx} className="mb-3 bg-white/5 backdrop-blur-sm rounded-lg p-3">
                <h3 className="font-bold">{edu.title}</h3>
                <p className="text-emerald-300">{edu.organization}</p>
                <p className="text-sm text-gray-400">
                  {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const TechModernTemplate = ({ data }) => (
  <div className="bg-gray-900 text-cyan-50 p-8 min-h-[1100px] font-mono">
    <div className="border-2 border-cyan-500 rounded-lg p-8">
      <div className="border-l-4 border-cyan-500 pl-6 mb-8">
        <h1 className="text-4xl font-bold text-cyan-400 mb-1">
          $ echo "{data.contactInfo?.fullName || 'developer'}"
        </h1>
        <p className="text-lg text-cyan-300">&gt; Full Stack Developer</p>
        <div className="mt-3 text-sm space-y-1 text-gray-400">
          {data.contactInfo?.email && <p>📧 {data.contactInfo.email}</p>}
          {data.contactInfo?.mobile && <p>📱 {data.contactInfo.mobile}</p>}
        </div>
      </div>

      <div className="mb-6 bg-gray-800/50 border border-cyan-500/30 rounded p-4">
        <p className="text-cyan-400 mb-2">// Professional Summary</p>
        <p className="text-sm leading-relaxed text-gray-300">{data.summary}</p>
      </div>

      <div className="mb-6">
        <p className="text-cyan-400 mb-3 text-lg">const skills = [</p>
        <p className="text-sm pl-4 text-gray-300 whitespace-pre-wrap">  {data.skills}</p>
        <p className="text-cyan-400 text-lg">];</p>
      </div>

      {data.experience?.length > 0 && (
        <div className="mb-6">
          <p className="text-cyan-400 mb-3 text-lg">const experience = {`{`}</p>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-4 pl-4 border-l-2 border-cyan-500/50">
              <h3 className="font-bold text-cyan-300">{exp.title}</h3>
              <p className="text-cyan-400 text-sm">{exp.organization}</p>
              <p className="text-xs text-gray-500 mb-2">
                {exp.startDate} - {exp.current ? "Present" : exp.endDate}
              </p>
              <p className="text-sm text-gray-300">{exp.description}</p>
            </div>
          ))}
          <p className="text-cyan-400 text-lg">{`}`};</p>
        </div>
      )}

      {data.education?.length > 0 && (
        <div>
          <p className="text-cyan-400 mb-3 text-lg">const education = [</p>
          {data.education.map((edu, idx) => (
            <div key={idx} className="mb-3 pl-4">
              <h3 className="font-bold text-cyan-300">{edu.title}</h3>
              <p className="text-cyan-400 text-sm">{edu.organization}</p>
              <p className="text-xs text-gray-500">
                {edu.startDate} - {edu.current ? "Present" : edu.endDate}
              </p>
            </div>
          ))}
          <p className="text-cyan-400 text-lg">];</p>
        </div>
      )}
    </div>
  </div>
);

export const AcademicFormalTemplate = ({ data }) => (
  <div className="bg-white text-gray-900 p-12 min-h-[1100px] font-serif">
    <div className="text-center mb-10 border-b-4 border-amber-700 pb-4">
      <h1 className="text-4xl font-bold mb-3">{data.contactInfo?.fullName || "CURRICULUM VITAE"}</h1>
      <div className="text-sm space-x-4">
        {data.contactInfo?.email && <span>{data.contactInfo.email}</span>}
        {data.contactInfo?.email && data.contactInfo?.mobile && <span>•</span>}
        {data.contactInfo?.mobile && <span>{data.contactInfo.mobile}</span>}
      </div>
    </div>

    <div className="mb-8">
      <h2 className="text-2xl font-bold text-amber-800 mb-3 border-b-2 border-amber-700">
        SUMMARY
      </h2>
      <p className="text-justify leading-relaxed">{data.summary}</p>
    </div>

    {data.experience?.length > 0 && (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-amber-800 mb-3 border-b-2 border-amber-700">
          PROFESSIONAL EXPERIENCE
        </h2>
        {data.experience.map((exp, idx) => (
          <div key={idx} className="mb-4">
            <h3 className="font-bold text-lg">{exp.title}</h3>
            <p className="italic">{exp.organization}</p>
            <p className="text-sm text-gray-600 mb-2">
              {exp.startDate} - {exp.current ? "Present" : exp.endDate}
            </p>
            <p className="text-justify">{exp.description}</p>
          </div>
        ))}
      </div>
    )}

    {data.education?.length > 0 && (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-amber-800 mb-3 border-b-2 border-amber-700">
          EDUCATION
        </h2>
        {data.education.map((edu, idx) => (
          <div key={idx} className="mb-3">
            <h3 className="font-bold">{edu.title}</h3>
            <p className="italic">{edu.organization}</p>
            <p className="text-sm text-gray-600">
              {edu.startDate} - {edu.current ? "Present" : edu.endDate}
            </p>
          </div>
        ))}
      </div>
    )}

    <div>
      <h2 className="text-2xl font-bold text-amber-800 mb-3 border-b-2 border-amber-700">
        SKILLS & COMPETENCIES
      </h2>
      <p className="whitespace-pre-wrap">{data.skills}</p>
    </div>

    {data.projects?.length > 0 && (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-amber-800 mb-3 border-b-2 border-amber-700">
          PROJECTS & PUBLICATIONS
        </h2>
        {data.projects.map((proj, idx) => (
          <div key={idx} className="mb-3">
            <h3 className="font-bold">{proj.title}</h3>
            <p className="italic">{proj.organization}</p>
            <p className="text-sm">{proj.description}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);