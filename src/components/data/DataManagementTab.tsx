import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  Database,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { TABLES, TableName } from "../../lib/supabase";
import { FlexibleDataRow } from "../../types";
import { DatabaseService } from "../../services/databaseService";
import { DataEntryForm } from "./DataEntryForm";
import { BulkUploadModal } from "./BulkUploadModal";
import { DataTable } from "../DataTable";

export function DataManagementTab() {
  const [selectedTable, setSelectedTable] = useState<TableName>(TABLES.FOM);
  const [tableData, setTableData] = useState<FlexibleDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<FlexibleDataRow | null>(
    null
  );
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Load data for selected table
  const loadTableData = async (tableName: TableName) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DatabaseService.fetchAll(tableName);

      if (result.error) {
        setError(result.error.message);
        setTableData([]);
      } else {
        setTableData(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when table selection changes
  useEffect(() => {
    loadTableData(selectedTable);
  }, [selectedTable]);

  const handleTableChange = (tableName: TableName) => {
    setSelectedTable(tableName);
    setSelectedRecords([]);
    setSearchTerm("");
  };

  const handleAddRecord = () => {
    setShowAddForm(true);
  };

  const handleEditRecord = (record: FlexibleDataRow) => {
    setShowEditForm(record);
  };

  const handleDeleteRecord = async (record: FlexibleDataRow) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    setIsLoading(true);
    try {
      const idColumn =
        selectedTable === TABLES.FOM || selectedTable === TABLES.LFOM
          ? "S.No."
          : "id";
      const recordId = record[idColumn];

      const result = await DatabaseService.deleteRecord(
        selectedTable,
        recordId,
        idColumn
      );

      if (result.error) {
        setError(result.error.message);
      } else {
        await loadTableData(selectedTable);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedRecords.length} records?`
      )
    )
      return;

    setIsLoading(true);
    try {
      const idColumn =
        selectedTable === TABLES.FOM || selectedTable === TABLES.LFOM
          ? "S.No."
          : "id";

      for (const recordId of selectedRecords) {
        await DatabaseService.deleteRecord(selectedTable, recordId, idColumn);
      }

      setSelectedRecords([]);
      await loadTableData(selectedTable);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete records");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecord = async (data: FlexibleDataRow) => {
    await loadTableData(selectedTable);
  };

  const filteredData = tableData.filter((record) =>
    Object.values(record).some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Data Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your database records with full CRUD operations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadTableData(selectedTable)}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowBulkUpload(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Upload</span>
          </button>

          <button
            onClick={handleAddRecord}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Table Selection */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value as TableName)}
              className="input-field w-full lg:w-64"
            >
              {Object.values(TABLES).map((tableName) => (
                <option key={tableName} value={tableName}>
                  {tableName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-64"
              />
            </div>

            {selectedRecords.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="btn-secondary text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete ({selectedRecords.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
              <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Records
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {filteredData.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg">
              <FileText className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Selected Table
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {selectedTable}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Selected Records
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedRecords.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400" />
            <p className="text-sm text-error-700 dark:text-error-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading {selectedTable} data...
              </p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No records found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm
                ? "No records match your search criteria"
                : `No data in ${selectedTable} table`}
            </p>
            <button
              onClick={handleAddRecord}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Record</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedTable} Records
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredData.length} of {tableData.length} records
              </div>
            </div>

            <DataTable
              data={filteredData}
              onEdit={handleEditRecord}
              onDelete={handleDeleteRecord}
              selectedRecords={selectedRecords}
              onSelectionChange={setSelectedRecords}
              showActions={true}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddForm && (
        <DataEntryForm
          tableName={selectedTable}
          onSave={handleSaveRecord}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {showEditForm && (
        <DataEntryForm
          tableName={selectedTable}
          initialData={showEditForm}
          onSave={handleSaveRecord}
          onCancel={() => setShowEditForm(null)}
          isEdit={true}
        />
      )}

      {showBulkUpload && (
        <BulkUploadModal
          tableName={selectedTable}
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            setShowBulkUpload(false);
            loadTableData(selectedTable);
          }}
        />
      )}
    </div>
  );
}
