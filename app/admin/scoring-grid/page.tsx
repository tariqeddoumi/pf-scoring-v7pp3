'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ScoringCriterion {
  id: string;
  code: string;
  label: string;
  description?: string;
  category: string;
  weight: number;
  minScore: number;
  maxScore: number;
  scoreType: string;
  isActive: boolean;
  orderIndex: number;
  thresholds?: ScoringThreshold[];
  options?: ScoringOption[];
}

interface ScoringThreshold {
  id: string;
  minValue: number;
  maxValue: number;
  score: number;
  label?: string;
}

interface ScoringOption {
  id: string;
  label: string;
  score: number;
  orderIndex: number;
}

interface RuntimeModel {
  id: string;
  code: string;
  label: string;
}

interface RuntimeVersion {
  id: string;
  label: string;
  versionNumber: number;
  isPublished: boolean;
  status: string;
}

interface RuntimeNode {
  id: string;
  code: string;
  label: string;
  nodeType: 'DOMAIN' | 'CRITERION' | 'SUB_CRITERION' | 'SUB_SUB_CRITERION' | string;
  parentNodeId?: string | null;
  weight?: number | null;
  isActive: boolean;
  isScored: boolean;
}

const CATEGORIES = [
  { label: 'Financial', value: 'Financial' },
  { label: 'Technical', value: 'Technical' },
  { label: 'Market', value: 'Market' },
  { label: 'Environmental', value: 'Environmental' },
  { label: 'Social', value: 'Social' },
  { label: 'Governance', value: 'Governance' },
  { label: 'Legal', value: 'Legal' },
  { label: 'Country', value: 'Country' },
];

const SCORE_TYPES = [
  { label: 'Numeric (Range)', value: 'NUMERIC' },
  { label: 'Option Selection', value: 'OPTION' },
  { label: 'Boolean (Yes/No)', value: 'BOOLEAN' },
  { label: 'Formula Calculated', value: 'FORMULA' },
];

export default function ScoringGridPage() {
  const [criteria, setCriteria] = useState<ScoringCriterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [runtimeModels, setRuntimeModels] = useState<RuntimeModel[]>([]);
  const [runtimeVersions, setRuntimeVersions] = useState<RuntimeVersion[]>([]);
  const [runtimeNodes, setRuntimeNodes] = useState<RuntimeNode[]>([]);
  const [selectedRuntimeModelId, setSelectedRuntimeModelId] = useState('');
  const [selectedRuntimeVersionId, setSelectedRuntimeVersionId] = useState('');
  const [runtimeLevelFilter, setRuntimeLevelFilter] = useState<
    'DOMAIN' | 'CRITERION' | 'SUB_CRITERION' | 'SUB_SUB_CRITERION'
  >('DOMAIN');
  const [savingNodeId, setSavingNodeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    label: '',
    description: '',
    category: 'Financial',
    weight: 0.125,
    minScore: 0,
    maxScore: 100,
    scoreType: 'NUMERIC',
  });

  // Fetch criteria on mount
  useEffect(() => {
    fetchCriteria();
    fetchRuntimeModels();
  }, []);

  useEffect(() => {
    const fetchRuntimeVersions = async () => {
      if (!selectedRuntimeModelId) {
        setRuntimeVersions([]);
        setSelectedRuntimeVersionId('');
        setRuntimeNodes([]);
        return;
      }

      const response = await fetch(
        `/api/admin/scoring/models/${selectedRuntimeModelId}/versions`
      );
      if (!response.ok) {
        setError('Impossible de charger les versions runtime');
        return;
      }
      const payload = await response.json();
      const versions: RuntimeVersion[] = payload.data || [];
      const published = versions.filter(
        (version) => version.isPublished || version.status === 'PUBLISHED'
      );
      setRuntimeVersions(published);
      setSelectedRuntimeVersionId(published[0]?.id || '');
    };

    fetchRuntimeVersions();
  }, [selectedRuntimeModelId]);

  useEffect(() => {
    const fetchRuntimeNodes = async () => {
      if (!selectedRuntimeModelId || !selectedRuntimeVersionId) {
        setRuntimeNodes([]);
        return;
      }

      const response = await fetch(
        `/api/admin/scoring/models/${selectedRuntimeModelId}/versions/${selectedRuntimeVersionId}/nodes`
      );
      if (!response.ok) {
        setError('Impossible de charger les noeuds runtime');
        return;
      }
      const payload = await response.json();
      setRuntimeNodes(payload.data || []);
    };

    fetchRuntimeNodes();
  }, [selectedRuntimeModelId, selectedRuntimeVersionId]);

  useEffect(() => {
    if (runtimeNodes.length === 0) return;

    const availableTypes = new Set(runtimeNodes.map((node) => node.nodeType));
    if (availableTypes.has(runtimeLevelFilter)) return;

    const fallbackOrder: Array<
      'DOMAIN' | 'CRITERION' | 'SUB_CRITERION' | 'SUB_SUB_CRITERION'
    > = ['DOMAIN', 'CRITERION', 'SUB_CRITERION', 'SUB_SUB_CRITERION'];
    const nextLevel = fallbackOrder.find((level) => availableTypes.has(level));
    if (nextLevel) {
      setRuntimeLevelFilter(nextLevel);
    }
  }, [runtimeNodes, runtimeLevelFilter]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/scoring-criteria');
      if (!response.ok) throw new Error('Failed to fetch criteria');
      const data = await response.json();
      setCriteria(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load criteria');
    } finally {
      setLoading(false);
    }
  };

  const fetchRuntimeModels = async () => {
    try {
      const response = await fetch('/api/admin/scoring/models');
      if (!response.ok) throw new Error('Failed to fetch scoring models');
      const data = await response.json();
      const models: RuntimeModel[] = data.data || [];
      setRuntimeModels(models);
      if (models.length > 0) {
        setSelectedRuntimeModelId(models[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load runtime models');
    }
  };

  const updateNodeWeight = async (nodeId: string, weight: number) => {
    if (!selectedRuntimeModelId || !selectedRuntimeVersionId) return;
    try {
      setSavingNodeId(nodeId);
      const response = await fetch(
        `/api/admin/scoring/models/${selectedRuntimeModelId}/versions/${selectedRuntimeVersionId}/nodes/${nodeId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight }),
        }
      );
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to update node weight');
      }
      setRuntimeNodes((prev) =>
        prev.map((node) => (node.id === nodeId ? { ...node, weight } : node))
      );
      setSuccess('Paramétrage runtime mis à jour');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du poids');
    } finally {
      setSavingNodeId(null);
    }
  };

  const handleAddCriteria = async () => {
    if (!formData.code || !formData.label) {
      setError('Code and label are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/scoring-criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight as any),
          minScore: parseFloat(formData.minScore as any),
          maxScore: parseFloat(formData.maxScore as any),
          orderIndex: criteria.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add criterion');
      }

      setSuccess('Criterion added successfully');
      setShowForm(false);
      setFormData({
        code: '',
        label: '',
        description: '',
        category: 'Financial',
        weight: 0.125,
        minScore: 0,
        maxScore: 100,
        scoreType: 'NUMERIC',
      });
      fetchCriteria();
    } catch (err: any) {
      setError(err.message || 'Failed to add criterion');
    }
  };

  const handleDeleteCriteria = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/scoring-criteria/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete criterion');

      setSuccess('Criterion deleted successfully');
      setDeleteConfirm(null);
      fetchCriteria();
    } catch (err: any) {
      setError(err.message || 'Failed to delete criterion');
    }
  };

  const toggleCriteria = (id: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCriteria(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Grille de Scoring</h1>
            <p className="text-slate-400 mt-1">
              Gérez les critères et thresholds de scoring
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Ajouter Critère
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 flex gap-2">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 flex gap-2">
          <CheckCircle size={20} className="flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <div className="flex gap-3">
          <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-400">
            <p className="font-semibold mb-2">Scoring Grid Configuration</p>
            <p>
              Define criteria by category, set weights, and configure scoring
              thresholds. Each criterion can have numeric ranges or predefined
              options.
            </p>
          </div>
        </div>
      </div>

      {/* Add Criteria Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Add New Criterion</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., leverage"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Leverage Ratio"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Score Type
              </label>
              <select
                value={formData.scoreType}
                onChange={(e) =>
                  setFormData({ ...formData, scoreType: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {SCORE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Weight (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.001"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Max Score
              </label>
              <input
                type="number"
                value={formData.maxScore}
                onChange={(e) =>
                  setFormData({ ...formData, maxScore: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe this criterion..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddCriteria}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Criterion
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading criteria...</p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Paramétrage runtime (domaine / critère / sous-critère / sous-sous-critère)
          </h2>
          <p className="text-sm text-slate-400">
            Cette section configure directement les nœuds runtime utilisés par l&apos;évaluation
            et le calcul de score.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={selectedRuntimeModelId}
              onChange={(e) => setSelectedRuntimeModelId(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">-- Modèle --</option>
              {runtimeModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label} ({model.code})
                </option>
              ))}
            </select>

            <select
              value={selectedRuntimeVersionId}
              onChange={(e) => setSelectedRuntimeVersionId(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              disabled={!selectedRuntimeModelId}
            >
              <option value="">-- Version publiée --</option>
              {runtimeVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.label || `v${version.versionNumber}`}
                </option>
              ))}
            </select>

            <select
              value={runtimeLevelFilter}
              onChange={(e) =>
                setRuntimeLevelFilter(
                  e.target.value as 'DOMAIN' | 'CRITERION' | 'SUB_CRITERION' | 'SUB_SUB_CRITERION'
                )
              }
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="DOMAIN">Niveau Domaine</option>
              <option value="CRITERION">Niveau Critère</option>
              <option value="SUB_CRITERION">Niveau Sous-critère</option>
              <option value="SUB_SUB_CRITERION">Niveau Sous-sous-critère</option>
            </select>
          </div>

          <div className="space-y-2">
            {runtimeNodes
              .filter((node) => node.nodeType === runtimeLevelFilter)
              .map((node) => (
                <div
                  key={node.id}
                  className="flex flex-col md:flex-row md:items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{node.label}</p>
                    <p className="text-xs text-slate-400">
                      {node.code} • {node.nodeType} • {node.isScored ? 'Scored' : 'Not scored'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={0.0001}
                      value={node.weight ?? 0}
                      onChange={(e) => {
                        const nextWeight = Number.parseFloat(e.target.value || '0');
                        setRuntimeNodes((prev) =>
                          prev.map((n) => (n.id === node.id ? { ...n, weight: nextWeight } : n))
                        );
                      }}
                      className="w-32 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    />
                    <button
                      onClick={() => updateNodeWeight(node.id, Number(node.weight ?? 0))}
                      disabled={savingNodeId === node.id}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 rounded text-white text-sm"
                    >
                      {savingNodeId === node.id ? '...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              ))}
            {selectedRuntimeVersionId &&
              runtimeNodes.filter((node) => node.nodeType === runtimeLevelFilter).length === 0 && (
              <p className="text-sm text-amber-400">
                Aucun nœud trouvé à ce niveau pour la version sélectionnée.
              </p>
              )}
          </div>
        </div>
      )}

      {/* Criteria List */}
      {!loading && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Criteria ({criteria.length})
          </h2>

          {criteria.length === 0 ? (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center text-slate-400">
              No criteria defined yet. Add one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {criteria.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleCriteria(item.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left flex-1">
                      <div>
                        <h3 className="font-semibold text-white">{item.label}</h3>
                        <p className="text-sm text-slate-400">{item.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        {item.category}
                      </span>
                      <span className="text-sm text-slate-400">
                        W: {item.weight.toFixed(3)}
                      </span>
                      {expandedCriteria.has(item.id) ? (
                        <ChevronUp size={20} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {expandedCriteria.has(item.id) && (
                    <div className="border-t border-slate-700 p-4 space-y-3 bg-slate-700/30">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Score Type</p>
                          <p className="text-white font-medium">{item.scoreType}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Min Score</p>
                          <p className="text-white font-medium">{item.minScore}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Max Score</p>
                          <p className="text-white font-medium">{item.maxScore}</p>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-sm text-slate-300">{item.description}</p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="px-3 py-1 text-red-400 hover:bg-red-500/20 rounded transition-colors flex items-center gap-1 text-sm"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Criterion?
            </h3>
            <p className="text-slate-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteCriteria(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
