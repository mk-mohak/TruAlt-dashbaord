import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { LoginCredentials, SignUpCredentials } from "../../types/auth";
// @ts-ignore
import trualtAnalytics1 from "../../assets/trualtAnalytics1.png";
// @ts-ignore
import TrualtLogo from "../../assets/TrualtLogo.png";

const loginSchema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const signUpSchema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

export function LoginScreen() {
  const { signIn, signUp, isLoading, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginCredentials | SignUpCredentials>({
    resolver: yupResolver(isSignUp ? signUpSchema : loginSchema),
  });

  const onSubmit = async (data: LoginCredentials | SignUpCredentials) => {
    const result = isSignUp
      ? await signUp(data as SignUpCredentials)
      : await signIn(data as LoginCredentials);
    if (!result.error) {
      reset();
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  return (
    <div className="min-h-screen flex relative bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
        <div
          className="mx-auto w-80 sm:w-96 md:w-[21rem] lg:w-[25rem] flex flex-col justify-center"
          style={{ minHeight: "clamp(400px, 60vh, 650px)" }}
        >
          <div className="flex flex-col items-center mb-7 mt-[-30px]">
            <img
              src={TrualtLogo}
              alt="Logo"
              className="w-30 h-11 mb-5 mx-auto"
            />
          </div>

          {/* Header - More compact */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#1A2885] mb-1">
              {isSignUp ? "Create Account" : "Sign In"}
            </h2>
            <p className="text-sm text-gray-600">
              {isSignUp
                ? "Create your account to get started"
                : "Enter your email and password to sign in!"}
            </p>
          </div>

          {/* Form with reduced spacing */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Email*
              </label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-3 py-2 text-sm border-[1.3px] border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-[#7AB839] focus:border-[#7AB839] focus:border-[1.3px] transition-colors"
                placeholder="mail@simmmple.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Password*
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 text-sm border-[1.3px] border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-[#7AB839] focus:border-[#7AB839] focus:border-[1.3px] transition-colors"
                  placeholder="Min. 8 characters"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Confirm Password*
                </label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full px-3 py-2 pr-10 text-sm border-[1.3px] border-gray-200 rounded-md focus:ring-1 focus:ring-[#7AB839] focus:border-[#7AB839] focus:border-[1.3px] transition-colors"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {(errors as any).confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            {/* Keep me logged in */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="keep-logged-in"
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="h-3.5 w-3.5 text-[#1A2885] border-gray-300 rounded focus:ring-0 focus:ring-offset-0"
                  />
                  <label
                    htmlFor="keep-logged-in"
                    className="ml-2 block text-xs text-gray-800"
                  >
                    Keep me logged in
                  </label>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2.5">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7AB839] text-white border-[#7AB839] border-[1.5px] text-md font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:bg-white hover:text-[#7AB839] hover:border-[1.5px] hover:border-[#7AB839] group"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-[#7AB839] border-t-transparent rounded-full" />
              ) : (
                <>
                  {isSignUp ? (
                    <UserPlus className="h-5 w-5 text-white group-hover:text-[#7AB839]" />
                  ) : (
                    <LogIn className="h-5 w-5 text-white group-hover:text-[#7AB839]" />
                  )}
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-xs text-gray-600">
              {isSignUp ? "Already have an account? " : "Not registered yet? "}
            </span>
            <button
              onClick={toggleMode}
              disabled={isLoading}
              className="text-xs text-[#1A2885] hover:text-blue-600 font-medium transition-colors disabled:opacity-50"
            >
              {isSignUp ? "Sign in" : "Create an Account"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Hide on mobile, show only on desktop */}
      <div className="hidden lg:block relative flex-1">
        <img
          src={trualtAnalytics1}
          alt="Login branding"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
