import { CATEGORY_META } from '../../shared/categories.js';
import type { CategoryId } from '../../shared/types.js';
import {
  ArrowLeftRight,
  Atom,
  Blocks,
  Braces,
  Brain,
  Bug,
  Cpu,
  Database,
  Eye,
  FileCode,
  FileType,
  Gauge,
  GitBranch,
  Globe,
  Infinity as InfinityIcon,
  Layers,
  Network,
  Plug,
  Puzzle,
  Regex,
  ScanSearch,
  SearchCode,
  ShieldCheck,
  SquareTerminal,
  Table,
  Terminal,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  terminal: Terminal,
  bug: Bug,
  network: Network,
  layers: Layers,
  gauge: Gauge,
  'search-code': SearchCode,
  eye: Eye,
  'file-code': FileCode,
  braces: Braces,
  'file-type': FileType,
  atom: Atom,
  globe: Globe,
  'arrow-left-right': ArrowLeftRight,
  plug: Plug,
  database: Database,
  table: Table,
  'square-terminal': SquareTerminal,
  'git-branch': GitBranch,
  infinity: InfinityIcon,
  'shield-check': ShieldCheck,
  'scan-search': ScanSearch,
  regex: Regex,
  brain: Brain,
  puzzle: Puzzle,
  blocks: Blocks,
  workflow: Workflow,
  cpu: Cpu,
};

export function categoryIcon(categoryId: string): LucideIcon {
  return ICONS[CATEGORY_META[categoryId as CategoryId]?.icon ?? ''] ?? Cpu;
}

export function categoryLabel(categoryId: string): string {
  return CATEGORY_META[categoryId as CategoryId]?.label ?? categoryId;
}

export const DIFFICULTY_ORDER = ['beginner', 'easy', 'intermediate', 'hard', 'expert'] as const;

export function difficultyLabel(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  coding: 'Coding Challenge',
  debugging: 'Debugging',
  output_prediction: 'Output Prediction',
  code_review: 'Code Review',
  sql: 'SQL',
  regex: 'Regex',
  git: 'Git',
  linux: 'Linux',
  networking: 'Networking',
  http: 'HTTP',
  api: 'API Design',
  cybersecurity: 'Cybersecurity',
  logic_puzzle: 'Logic Puzzle',
  algorithm: 'Algorithm',
  data_structure: 'Data Structure',
  architecture: 'Architecture',
  system_design: 'System Design',
  performance: 'Performance',
  security_analysis: 'Security Analysis',
  reasoning: 'Technical Reasoning',
};

export function challengeTypeLabel(type: string): string {
  return CHALLENGE_TYPE_LABELS[type] ?? type;
}
