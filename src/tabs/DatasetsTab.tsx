@@ .. @@
 // Use the same color function as FlexibleChart for consistency
-const getUniqueDatasetColor = (datasetIndex: number, totalDatasets: number) => {
+const getDatasetColorByName = (datasetName: string) => {
+  const lowerName = datasetName.toLowerCase();
+  
+  // Fixed color mapping based on dataset type
+  if (lowerName.includes('pos') && lowerName.includes('fom') && !lowerName.includes('lfom')) {
+    return '#3b82f6'; // Blue for POS FOM
+  } else if (lowerName.includes('pos') && lowerName.includes('lfom')) {
+    return '#7ab839'; // Green for POS LFOM
+  } else if (lowerName.includes('lfom') && !lowerName.includes('pos')) {
+    return '#7ab839'; // Green for LFOM
+  } else if (lowerName.includes('fom') && !lowerName.includes('pos') && !lowerName.includes('lfom')) {
+    return '#f97316'; // Orange for FOM
+  }
+  
+  // Fallback colors for other datasets
   const baseColors = [
-    '#3b82f6', // blue
-    '#7ab839', // green
-    '#f97316', // orange
-    '#ef4444', // red
-    '#1A2885', // dark blue
-    '#06b6d4', // cyan
-    '#f59e0b', // amber
-    '#dc2626', // red variant
-    '#84cc16', // lime
-    '#059669', // emerald
-    '#8b5cf6', // purple
-    '#ec4899', // pink
-    '#14b8a6', // teal
-    '#f97316', // orange variant
-    '#6366f1', // indigo
+    '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#dc2626', '#84cc16', '#059669'
   ];
   
-  return baseColors[datasetIndex % baseColors.length];
+  return baseColors[Math.abs(datasetName.length) % baseColors.length];
 };