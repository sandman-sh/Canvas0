import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables in client configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Universal object properties stored as JSONB
export interface ObjectProperties {
  // Appearance
  opacity?: number;           // 0.0 to 1.0
  blendMode?: string;         // CSS mix-blend-mode
  // Border/Stroke
  strokeColor?: string;
  strokeWidth?: number;
  strokeDashArray?: number[]; // e.g. [5,5] for dashed, [2,2] for dotted
  strokeDashPreset?: string;  // 'solid' | 'dashed' | 'dotted' | 'dashdot'
  // Shadow
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  // Constraints
  lockAspectRatio?: boolean;
  lockMovement?: boolean;
  hidden?: boolean;
  // Fill
  fill?: string;
  // Gradient Fill
  gradientEnabled?: boolean;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;     // 0=top-bottom, 90=left-right, etc.
  // Corner radius (shapes)
  cornerRadius?: number;
  // Text properties
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;         // left, center, right, justify
  textFill?: string;
  // Image properties
  imageUrl?: string;
  sizingMode?: string;        // fill, fit, crop, tile
  brightness?: number;
  contrast?: number;
  saturation?: number;
  grayscale?: boolean;
  invert?: boolean;
  sepia?: boolean;
  // Shader properties
  shaderType?: string;        // fragment, vertex
  shaderSource?: string;      // GLSL code
  uniforms?: Record<string, number>;
  // Pen/Path data
  pathData?: string;          // SVG path d attribute
  // Frame/Container properties
  clipContent?: boolean;      // overflow hidden when true
  // Star properties
  starPoints?: number;        // number of points (3-12)
  starInnerRadius?: number;   // inner radius ratio (0.1-0.9)
  // Arrow properties
  arrowHead?: 'one' | 'both' | 'none';
  // Sticky Note properties
  stickyColor?: string;       // preset sticky note color
  // Comment properties
  commentText?: string;
  commentAuthor?: string;
  // Layout properties
  layoutType?: 'none' | 'flex' | 'grid';
  flexDirection?: 'row' | 'column';
  flexGap?: number;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  gridCols?: number;
  gridGap?: number;
  padding?: number;
}

export interface CanvasAsset {
  id: string;
  type: 'text' | 'image' | 'rect' | 'ellipse' | 'line' | 'path' | 'shader' | 'frame' | 'star' | 'arrow' | 'sticky' | 'comment' | 'container' | 'flexbox' | 'grid';
  content: string;
  x_pos: number;
  y_pos: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  properties: ObjectProperties;
  creator_id: string;
  parent_id?: string | null;
  room_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  activeTool?: string;
  lastActive: number;
}

// Fetch all assets from canvas_assets by room
export async function getAssets(roomId: string): Promise<CanvasAsset[]> {
  const { data, error } = await supabase
    .from('canvas_assets')
    .select('*')
    .eq('room_id', roomId)
    .order('z_index', { ascending: true });

  if (error) {
    console.error('Error fetching assets:', error);
    throw new Error(error.message || 'Failed to fetch assets');
  }
  return data || [];
}

// Add a new asset to the canvas
export async function addAsset(asset: Omit<CanvasAsset, 'id'>, roomId: string): Promise<CanvasAsset> {
  const { data, error } = await supabase
    .from('canvas_assets')
    .insert([{ ...asset, room_id: roomId }])
    .select()
    .single();

  if (error) {
    console.error('Error adding asset:', error);
    throw new Error(error.message || 'Failed to add asset');
  }
  return data;
}

// Update an asset (position, size, rotation, properties, etc.)
export async function updateAsset(id: string, updates: Partial<CanvasAsset>): Promise<void> {
  const { error } = await supabase
    .from('canvas_assets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating asset:', error);
    throw new Error(error.message || 'Failed to update asset');
  }
}

// Update coordinates onDragEnd (legacy compat)
export async function updateAssetPosition(id: string, x_pos: number, y_pos: number): Promise<void> {
  return updateAsset(id, { x_pos, y_pos });
}

// Delete an asset from the canvas
export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase
    .from('canvas_assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting asset:', error);
    throw new Error(error.message || 'Failed to delete asset');
  }
}
