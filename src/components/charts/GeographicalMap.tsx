import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../../contexts/AppContext';

interface GeographicalMapProps {
  data: DataRow[];
  className?: string;
}

function MapUpdater({ data }: { data: DataRow[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (data.length > 0) {
      const factoryData = DataProcessor.aggregateByFactory(data);
      const bounds = factoryData.map(factory => [factory.latitude, factory.longitude] as [number, number]);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [data, map]);

  return null;
}

export function GeographicalMap({ data, className = '' }: GeographicalMapProps) {
  const { state, getMultiDatasetData } = useApp();
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
  const factoryData = DataProcessor.aggregateByFactory(data);
  
  const getMarkerSize = (revenue: number, maxRevenue: number) => {
    const minSize = 10;
    const maxSize = 30;
    return minSize + (revenue / maxRevenue) * (maxSize - minSize);
  };

  const getMarkerColor = (revenue: number, maxRevenue: number) => {
    const intensity = revenue / maxRevenue;
    if (intensity > 0.7) return '#ef4444'; // High revenue - red
    if (intensity > 0.4) return '#f97316'; // Medium revenue - orange
    return '#3b82f6'; // Low revenue - blue
  };

  const maxRevenue = Math.max(...factoryData.map(factory => factory.totalRevenue));

  if (factoryData.length === 0) {
    return (
      <div className={`card ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Geographical Sales Map
        </h3>
        <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No geographical data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Geographical Sales Map{isMultiDataset ? ' - Combined View' : ''}
      </h3>
      <div className="h-80 rounded-lg overflow-hidden">
        <MapContainer
          center={[40.0, -95.0]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater data={data} />
          
          {isMultiDataset ? (
            // Show markers for each dataset with different styling
            multiDatasetData.map((dataset, datasetIndex) => {
              const datasetFactoryData = DataProcessor.aggregateByFactory(dataset.data);
              const datasetMaxRevenue = Math.max(...datasetFactoryData.map(f => f.totalRevenue));
              
              return datasetFactoryData.map((factory, factoryIndex) => (
                <CircleMarker
                  key={`${dataset.datasetId}-${factory.name}`}
                  center={[
                    factory.latitude + (datasetIndex * 0.01), // Slight offset for visibility
                    factory.longitude + (datasetIndex * 0.01)
                  ]}
                  radius={getMarkerSize(factory.totalRevenue, datasetMaxRevenue)}
                  fillColor={dataset.color}
                  color="#ffffff"
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.7}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: dataset.color }}
                        />
                        <span className="font-medium">{dataset.datasetName}</span>
                      </div>
                      <h4 className="font-semibold">{factory.name}</h4>
                      <p>Revenue: {DataProcessor.formatCurrency(factory.totalRevenue, state.settings.currency)}</p>
                      <p>Units: {DataProcessor.formatNumber(factory.totalUnits)}</p>
                      <p>Products: {factory.products}</p>
                      <p>Plants: {factory.plants}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ));
            })
          ) : (
            factoryData.map((factory) => (
              <CircleMarker
                key={factory.name}
                center={[factory.latitude, factory.longitude]}
                radius={getMarkerSize(factory.totalRevenue, maxRevenue)}
                fillColor={getMarkerColor(factory.totalRevenue, maxRevenue)}
                color="#ffffff"
                weight={2}
                opacity={0.8}
                fillOpacity={0.6}
              >
                <Popup>
                  <div className="text-sm">
                    <h4 className="font-semibold">{factory.name}</h4>
                    <p>Revenue: {DataProcessor.formatCurrency(factory.totalRevenue, state.settings.currency)}</p>
                    <p>Units: {DataProcessor.formatNumber(factory.totalUnits)}</p>
                    <p>Products: {factory.products}</p>
                    <p>Plants: {factory.plants}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))
          )}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        {isMultiDataset ? (
          multiDatasetData.map(dataset => (
            <div key={dataset.datasetId} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{dataset.datasetName}</span>
            </div>
          ))
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Low Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Medium Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">High Revenue</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}