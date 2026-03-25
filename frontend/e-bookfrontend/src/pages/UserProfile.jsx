import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import { User, Users, CheckCircle, Mail, MapPin, Briefcase } from "lucide-react";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setFollowers(res.data.followers || []);
      setFollowing(res.data.following || []);
      
      // Check if current user is implicitly following this profile
      if (res.data.followers && currentUserId) {
        setIsFollowing(res.data.followers.some(f => f._id === currentUserId || f === currentUserId));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsFollowing(res.data.isFollowing);
      
      // We would ideally fetch the profile again or update state based on response
      fetchProfile();
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white font-sans">
        <UserNavbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6ee7b7] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-white font-sans">
        <UserNavbar />
        <div className="flex-1 flex justify-center items-center text-gray-500 text-xl font-bold">
          User not found
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === id;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <UserNavbar />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Cover Photo Area - Gradient */}
        <div className="h-64 bg-gradient-to-r from-blue-300 to-indigo-400 w-full relative"></div>

        {/* Profile Content */}
        <div className="max-w-5xl mx-auto px-6 sm:px-10 -mt-24 relative z-10">
          
          <div className="bg-white rounded-3xl shadow-sm p-8 sm:p-12 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200 shrink-0">
                  <img 
                    src={profile.photo && profile.photo !== "default-avatar.png" 
                      ? `http://localhost:5000/uploads/${profile.photo}` 
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div>
                  <h1 className="text-4xl font-black text-gray-900 flex items-center gap-2">
                    {profile.name}
                    {profile.role === "admin" && <CheckCircle className="w-6 h-6 text-blue-500" />}
                  </h1>
                  <p className="text-gray-500 font-medium text-lg mt-1">{profile.email}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                {isOwnProfile ? (
                  <button 
                    onClick={() => navigate('/settings')}
                    className="px-6 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold transition shadow-sm border border-gray-200"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={handleFollowToggle}
                    className={`px-8 py-2.5 rounded-full font-bold transition shadow-sm ${
                      isFollowing 
                        ? "bg-gray-100 hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200" 
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-center">
                <span className="block text-2xl font-black text-gray-900">{followers.length}</span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Followers</span>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-center">
                <span className="block text-2xl font-black text-gray-900">{following.length}</span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Following</span>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-center">
                <span className="block text-2xl font-black text-gray-900">{profile.uploads?.length || 0}</span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Uploads</span>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                About Me
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-3xl">
                {profile.bio || "This user hasn't written a bio yet."}
              </p>
            </div>
          </div>

          {/* Followers / Following Grid Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Followers Area */}
            <div className="bg-white rounded-3xl shadow-sm p-8 h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                Recent Followers
              </h3>
              
              {followers.length === 0 ? (
                <p className="text-gray-400 italic">No followers yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {followers.slice(0, 5).map(follower => (
                    <div 
                      key={follower._id} 
                      className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition"
                      onClick={() => navigate(`/profile/${follower._id}`)}
                    >
                      <img 
                        src={follower.photo && follower.photo !== "default-avatar.png" ? `http://localhost:5000/uploads/${follower.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.name)}`} 
                        className="w-12 h-12 rounded-full"
                        alt={follower.name}
                      />
                      <div>
                        <p className="font-bold text-gray-900">{follower.name}</p>
                      </div>
                    </div>
                  ))}
                  {followers.length > 5 && (
                    <button className="text-indigo-600 font-bold text-sm mt-2 hover:underline text-left">
                      View all {followers.length} followers
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Following Area */}
            <div className="bg-white rounded-3xl shadow-sm p-8 h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                Following
              </h3>
              
              {following.length === 0 ? (
                <p className="text-gray-400 italic">Not following anyone yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {following.slice(0, 5).map(followedUser => (
                    <div 
                      key={followedUser._id} 
                      className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition"
                      onClick={() => navigate(`/profile/${followedUser._id}`)}
                    >
                      <img 
                        src={followedUser.photo && followedUser.photo !== "default-avatar.png" ? `http://localhost:5000/uploads/${followedUser.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(followedUser.name)}`} 
                        className="w-12 h-12 rounded-full"
                        alt={followedUser.name}
                      />
                      <div>
                        <p className="font-bold text-gray-900">{followedUser.name}</p>
                      </div>
                    </div>
                  ))}
                  {following.length > 5 && (
                    <button className="text-indigo-600 font-bold text-sm mt-2 hover:underline text-left">
                      View all {following.length} following
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
