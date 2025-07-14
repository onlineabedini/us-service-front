//@collaps
import React, { useEffect, useState } from "react";
import ChangeLang from "../global/changeLangDropdonw";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_BASE_URL } from '@/config/api';
import { FiLogIn, FiLogOut, FiUserPlus, FiUser, FiBriefcase, FiInfo, FiHeart, FiShield, FiClock, FiBookmark } from "react-icons/fi";
import { providerService } from "@/services/provider.service";
import { clientService } from "@/services/client.service";
import { getCookie } from '@/utils/authCookieService';

const baseUrl = API_BASE_URL;

const Navbar: React.FC = () => {

  // Assign user data to another variable for debugging
  const [userData, setUserData] = useState<any>(null);
  const [clientUser, setClientUser] = useState<any>(null);

  // get user data from
  const getUserData = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      return;
    }
    const response = await providerService.getProfile(userId);
    setUserData(response);
  }

  // Get client data for bookmark functionality
  const getClientData = async () => {
    const clientId = getCookie('clientId');
    const token = getCookie('token');

    if (!clientId || !token) {
      setClientUser(null);
      return;
    }

    try {
      const response = await clientService.getClient(clientId);
      if (response && response.id) {
        setClientUser(response);
      } else {
        setClientUser(null);
      }
    } catch (error: any) {
      setClientUser(null);
    }
  };

  useEffect(() => {
    getUserData();
    getClientData();
  }, []);

  // Debug: Log user data to the console whenever it changes
  useEffect(() => {

  }, [userData]);

  return (
    <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-6 mx-auto border border-gray-100/50 mb-8 max-w-7xl transition-all duration-300 hover:shadow-teal-100/20">
      <nav className="flex justify-between items-center mx-auto">
        {/* Logo with hover effect */}
        <a href="/" className="group flex items-center transform hover:scale-[1.02] transition-all duration-300">
          <span className="text-3xl font-extrabold transition-all duration-300">
            <span className="text-teal-600 group-hover:text-teal-700">Vitago</span>
          </span>
          <div className="relative ml-2">
            <div className="absolute inset-0 bg-teal-400 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative h-2 w-2 bg-teal-500 rounded-full group-hover:animate-ping"></div>
          </div>
        </a>

        {/* Navigation Links and Buttons */}
        <div className="flex items-center space-x-8">
          <div>
            <ChangeLang />
          </div>
          <div className="flex space-x-12 text-lg font-medium">
            <a
              href="/marketPlace"
              className="relative text-gray-600 hover:text-teal-600 transition-colors duration-300
                         after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-teal-600 
                         after:transition-all after:duration-300 hover:after:w-full flex items-center gap-2"
            >
              <FiBriefcase className="w-5 h-5" />
              Providers
            </a>
            {clientUser && (
              <a
                href={`/bookmarks/${clientUser.id}`}
                className="relative text-gray-600 hover:text-teal-600 transition-colors duration-300
                           after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-teal-600 
                           after:transition-all after:duration-300 hover:after:w-full flex items-center gap-2"
              >
                <FiBookmark className="w-5 h-5" />
                Bookmarks
              </a>
            )}
            <a
              href="/about-us"
              className="relative text-gray-600 hover:text-teal-600 transition-colors duration-300
                         after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-teal-600 
                         after:transition-all after:duration-300 hover:after:w-full flex items-center gap-2"
            >
              <FiInfo className="w-5 h-5" />
              About Us
            </a>
          </div>

          <div className="flex space-x-4 border-l border-gray-200 pl-8">
            {userData ? (
              <div className="relative group">
                <a
                  href="/marketPlace"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData.user.profileImage ? `${baseUrl}/${userData.user.profileImage}` : "/src/assets/img/provider.jpg"} alt={userData.user.username} />
                    <AvatarFallback>{userData.user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{userData.user.username}</span>
                </a>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible
                              group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <button
                    onClick={() => {
                      // clearUser();
                      window.location.href = "/";
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50
                             transition-colors duration-200 rounded-lg flex items-center gap-2">
                    <FiLogOut className="text-red-600" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative group">
                  <a href="/login/client" className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-500 text-white py-2.5 px-6 rounded-lg 
                               hover:from-teal-500 hover:to-teal-400 transition-all duration-300 shadow-lg
                               hover:shadow-teal-200 transform hover:-translate-y-0.5 flex items-center gap-2 group/btn
                               before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500">
                    <FiLogIn className="text-white" />
                    Sign In
                  </a>
                  <div className="absolute right-0 mt-2 w-[480px] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl opacity-0 invisible
                                group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-6 grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Client Login</h3>
                      <a href="/login/client" className="flex items-start gap-3 p-3 rounded-lg hover:bg-teal-50 transition-all duration-300 group/item">
                        <div className="p-2 rounded-lg bg-teal-100 text-teal-600 group-hover/item:bg-teal-200 transition-colors">
                          <FiUser className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 mb-1">Personal Account</span>
                          <span className="text-sm text-gray-500">Access your personal dashboard</span>
                        </div>
                      </a>
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                        <span className="flex items-center gap-1"><FiClock className="w-4 h-4" /> Quick login</span>
                        <span className="flex items-center gap-1"><FiShield className="w-4 h-4" /> Secure access</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Provider Login</h3>
                      <a href="/login/provider" className="flex items-start gap-3 p-3 rounded-lg hover:bg-teal-50 transition-all duration-300 group/item">
                        <div className="p-2 rounded-lg bg-teal-100 text-teal-600 group-hover/item:bg-teal-200 transition-colors">
                          <FiBriefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 mb-1">Business Account</span>
                          <span className="text-sm text-gray-500">Manage your business profile</span>
                        </div>
                      </a>
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                        <span className="flex items-center gap-1"><FiHeart className="w-4 h-4" /> Client reviews</span>
                        <span className="flex items-center gap-1"><FiInfo className="w-4 h-4" /> Support 24/7</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <a href="/register/client" className="relative overflow-hidden border-2 border-teal-600 text-teal-600 py-2.5 px-6 rounded-lg 
                               hover:bg-teal-600 hover:text-white transition-all duration-300 
                               shadow-sm hover:shadow-teal-200 transform hover:-translate-y-0.5 inline-flex items-center gap-2 group/btn
                               before:absolute before:inset-0 before:bg-teal-100/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500">
                    <FiUserPlus className="text-teal-600" />
                    Sign Up
                  </a>
                  <div className="absolute right-0 mt-2 w-[480px] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl opacity-0 invisible
                                group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-6 grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Client Registration</h3>
                      <a href="/register/client" className="flex items-start gap-3 p-3 rounded-lg hover:bg-teal-50 transition-all duration-300 group/item">
                        <div className="p-2 rounded-lg bg-teal-100 text-teal-600 group-hover/item:bg-teal-200 transition-colors">
                          <FiUser className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 mb-1">Join as Client</span>
                          <span className="text-sm text-gray-500">Find and book services easily</span>
                        </div>
                      </a>
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                        <span className="flex items-center gap-1"><FiClock className="w-4 h-4" /> Quick setup</span>
                        <span className="flex items-center gap-1"><FiHeart className="w-4 h-4" /> Free account</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Provider Registration</h3>
                      <a href="/register/provider" className="flex items-start gap-3 p-3 rounded-lg hover:bg-teal-50 transition-all duration-300 group/item">
                        <div className="p-2 rounded-lg bg-teal-100 text-teal-600 group-hover/item:bg-teal-200 transition-colors">
                          <FiBriefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 mb-1">Join as Provider</span>
                          <span className="text-sm text-gray-500">Grow your business with us</span>
                        </div>
                      </a>
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                        <span className="flex items-center gap-1"><FiShield className="w-4 h-4" /> Verified profile</span>
                        <span className="flex items-center gap-1"><FiInfo className="w-4 h-4" /> Business tools</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;