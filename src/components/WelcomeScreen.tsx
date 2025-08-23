import React from 'react';
import { BarChart3, Upload, Zap, Shield, Globe, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { DatabaseStatus } from './DatabaseStatus';

interface WelcomeScreenProps {
  onFileUpload: () => void;
}

export function WelcomeScreen({ onFileUpload }: WelcomeScreenProps) {
  const { loadSampleData, state } = useApp();

  const features = [
    {
      icon: BarChart3,
      title: 'Flexible Data Support',
      description: 'Automatically adapts to any CSV/Excel structure with intelligent column detection',
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: 'Handles large datasets with virtualization and optimized processing',
    },
    {
      icon: Shield,
      title: 'Client-Side Processing',
      description: 'All data processing happens in your browser - completely secure',
    },
    {
      icon: Globe,
      title: 'Universal Compatibility',
      description: 'Works with any CSV, Excel, or JSON file structure',
    },
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'Automatic chart generation and KPI calculation based on your data',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Database Status at top */}
        <div className="mb-8">
          <DatabaseStatus />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-6">
            <BarChart3 className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Welcome to <span className="text-primary-600 dark:text-primary-400">TruAlt Analytics</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Transform any data into actionable insights with our intelligent, adaptive analytics dashboard. 
            Upload your files with any structure - we'll handle the rest automatically.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={onFileUpload}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 transform hover:scale-105 transition-transform"
            >
              <Upload className="h-5 w-5" />
              <span>{state.isConnectedToDatabase ? 'Upload to Database' : 'Upload Your Data'}</span>
            </button>
            
            <button
              onClick={loadSampleData}
              className="btn-secondary text-lg px-8 py-4 transform hover:scale-105 transition-transform"
            >
              {state.isConnectedToDatabase ? 'Load from Database' : 'Try Sample Data'}
            </button>
          </div>

          {/* Supported Formats */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Supports any Excel (.xlsx), CSV (.csv), and JSON (.json) structure • Multi-file upload • Drag & drop
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Supported Data Types */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Supported Data Types
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                📊 Sales Data
              </h3>
              <div className="space-y-2">
                {[
                  'Date, Name, Address',
                  'Quantity, Price, Revenue',
                  'Buyer Type, Location',
                  'Any sales-related columns'
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                🏭 Production Data
              </h3>
              <div className="space-y-2">
                {[
                  'Production quantities',
                  'Sales figures',
                  'Stock levels',
                  'Manufacturing metrics'
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                📈 Any Structure
              </h3>
              <div className="space-y-2">
                {[
                  'Automatic column detection',
                  'Flexible data types',
                  'No predefined schema',
                  'Intelligent processing'
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}