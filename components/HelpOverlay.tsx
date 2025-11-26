
import React, { useState } from 'react';
import { X, Book, Keyboard, Box, Zap, Layers, Image as ImageIcon, Globe, MousePointer2 } from 'lucide-react';
import clsx from 'clsx';

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section = ({ title, children, icon: Icon }: any) => (
  <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
      {Icon && <Icon size={18} className="text-purple-400" />}
      <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
    </div>
    <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
      {children}
    </div>
  </div>
);

const Key = ({ children }: { children: React.ReactNode }) => (
  <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-gray-200 font-mono text-xs mx-1 shadow-sm">
    {children}
  </span>
);

type Language = 'en' | 'zh';

interface NodeItem {
  name: string;
  desc: string;
  props?: string;
}

interface NodeCategory {
  title: string;
  desc: string;
  items: NodeItem[];
}

const HelpOverlay: React.FC<HelpOverlayProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'nodes' | 'shortcuts'>('guide');
  const [lang, setLang] = useState<Language>('zh');

  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');

  // --- CONTENT DATA ---

  const T = {
    en: {
      sidebar: {
        title: "Documentation",
        guide: "Getting Started",
        nodes: "Node Reference",
        shortcuts: "Shortcuts",
      },
      guide: {
        intro: {
          title: "Introduction",
          text1: "NodeGraph Texture Lab is a procedural texture generation tool inspired by Substance Designer. It allows you to create complex, resolution-independent textures by connecting logical blocks (Nodes).",
          text2: "The workflow runs entirely in your browser using SVG (Vector) and Canvas (Raster) technology."
        },
        concepts: {
          title: "Core Concepts",
          vector: "Blue Nodes (Vector/SVG):",
          vectorDesc: "Resolution independent. Shapes, gradients, and math operations start as vectors. They stay crisp at any zoom level.",
          bitmap: "Green Nodes (Bitmap/Raster):",
          bitmapDesc: "Pixel-based. Nodes like 'Pixelate', 'Polar Coords', or 'Image' convert data to pixels. Once converted to Bitmap, you cannot pass it back to a Vector input.",
          output: "The Output Node:",
          outputDesc: "Every graph must end with an OUTPUT node to visualize the final result and export the texture."
        },
        preview: {
          title: "Preview & Export",
          text: "The 3D Preview on the bottom right shows your texture applied to a 3D model. Select the OUTPUT node and check the Inspector panel to export PNGs up to 4K."
        }
      },
      nodes: [
        {
          title: "Generators",
          desc: "Create base shapes, patterns, and gradients.",
          items: [
            { name: "Rectangle", desc: "Basic rectangle primitive with configurable rounded corners for each vertex.", props: "Width, Height, Radius (TL, TR, BL, BR)" },
            { name: "Circle", desc: "Ellipse or Circle primitive.", props: "Width, Height" },
            { name: "Polygon", desc: "Regular polygon or star shape with adjustable inner/outer radius.", props: "Points, Inner Radius, Outer Radius" },
            { name: "Wavy Ring", desc: "Circular ring with sinusoidal distortion applied to the path.", props: "Radius, Frequency, Amplitude" },
            { name: "Beam", desc: "Trapezoidal beam shape with a vertical fade gradient, useful for light shafts.", props: "Length, Top Width, Bottom Width" },
            { name: "Gradient", desc: "Linear gradient generator with multiple stops and gamma correction.", props: "Stops, Direction X/Y, Power" },
          ]
        },
        {
          title: "Inputs",
          desc: "Provide raw data like colors, values, or images.",
          items: [
            { name: "Color", desc: "Outputs a solid RGBA color block.", props: "Red, Green, Blue" },
            { name: "Value", desc: "Outputs a grayscale value (0-1).", props: "Value (Luminance)" },
            { name: "Alpha", desc: "Outputs an opacity value (0-1) or applies opacity to an input.", props: "Value" },
            { name: "Image", desc: "Upload and output an external image file.", props: "File Upload" },
          ]
        },
        {
          title: "Filters",
          desc: "Modify the appearance of existing shapes.",
          items: [
            { name: "Fill", desc: "Modify the fill and stroke properties of a shape.", props: "Fill Enabled, Stroke Width" },
            { name: "Hard Glow", desc: "Adds a multi-layered Gaussian bloom effect.", props: "Radius, Intensity" },
            { name: "Neon", desc: "Intense outline glow effect.", props: "Radius" },
            { name: "Soft Blur", desc: "Simple Gaussian blur.", props: "Radius" },
            { name: "Stroke", desc: "Converts shapes to outlines.", props: "Width, Opacity" },
            { name: "Fade", desc: "Applies a linear gradient transparency mask.", props: "Angle, Start Opacity, End Opacity" },
            { name: "Pixelate", desc: "Rasterizes the input and downsamples it for a retro effect.", props: "Pixel Size" },
          ]
        },
        {
          title: "Transforms",
          desc: "Move, rotate, or warp coordinate spaces.",
          items: [
            { name: "Translate", desc: "Move the content along X and Y axes.", props: "X Offset, Y Offset" },
            { name: "Rotate", desc: "Rotate the content around the center.", props: "Angle" },
            { name: "Scale", desc: "Resize the content from the center.", props: "Factor" },
            { name: "Polar Coords", desc: "Warp coordinates between Cartesian and Polar. Creates bursts or rings.", props: "Mode, Radial Scale, Angular Scale" },
          ]
        },
        {
          title: "Math (Boolean)",
          desc: "Combine shapes using CSG logic and blend modes.",
          items: [
            { name: "Add", desc: "Union (A ∪ B). Combines shapes and adds pixel color values.", props: "Input A, Input B" },
            { name: "Subtract", desc: "Difference (A - B). Removes the shape of B from A.", props: "Input A, Input B" },
            { name: "Multiply", desc: "Intersection (A ∩ B). Keeps only the overlapping area.", props: "Input A, Input B" },
            { name: "Divide", desc: "Exclusion (A ⊕ B). Removes the overlapping area (XOR effect).", props: "Input A, Input B" },
          ]
        }
      ] as NodeCategory[],
      shortcuts: {
        menu: "Open Node Menu",
        delete: "Delete Selection",
        pan: "Pan Canvas",
        zoom: "Zoom Canvas",
        multi: "Multi-Select",
        tipTitle: "Pro Tip",
        tipText: "Double-click on empty space to deselect everything. You can also click on connection lines (Edges) to select and delete them."
      }
    },
    zh: {
      sidebar: {
        title: "帮助文档",
        guide: "入门指南",
        nodes: "节点参考",
        shortcuts: "快捷键与操作",
      },
      guide: {
        intro: {
          title: "简介",
          text1: "NodeGraph Texture Lab 是一款灵感来源于 Substance Designer 的程序化贴图生成工具。通过连接不同的逻辑方块（节点），您可以创建复杂的、与分辨率无关的纹理。",
          text2: "该工作流完全在浏览器中运行，结合了 SVG（矢量）和 Canvas（光栅/位图）技术。"
        },
        concepts: {
          title: "核心概念",
          vector: "蓝色节点 (矢量/SVG):",
          vectorDesc: "与分辨率无关。形状、渐变和数学运算最初都是矢量。它们在任何缩放级别下都能保持清晰。",
          bitmap: "绿色节点 (位图/光栅):",
          bitmapDesc: "基于像素。像“像素化”、“极坐标”或“图片”这样的节点会将数据转换为像素。一旦转换为位图，数据就无法再传回给矢量输入端。",
          output: "输出节点 (Output):",
          outputDesc: "每个图表都必须以 OUTPUT 节点结束，用于预览最终结果并导出贴图。"
        },
        preview: {
          title: "预览与导出",
          text: "右下角的 3D 预览窗口实时展示贴图应用在模型上的效果。选中 OUTPUT 节点后，在属性面板中可以将贴图导出为最高 4K 分辨率的 PNG 图片。"
        }
      },
      nodes: [
        {
          title: "生成器 (Generators)",
          desc: "创建基础形状、图案和渐变。",
          items: [
            { name: "矩形 (Rectangle)", desc: "带圆角配置的基础矩形，支持单独设置四个角的半径。", props: "宽, 高, 圆角半径 (TL, TR, BL, BR)" },
            { name: "圆形 (Circle)", desc: "椭圆或圆形图元。", props: "宽, 高" },
            { name: "多边形 (Polygon)", desc: "支持内径/外径调节的正多边形或星形。", props: "边数, 内径, 外径" },
            { name: "波浪环 (Wavy Ring)", desc: "带有正弦波扭曲的圆环。", props: "半径, 频率, 振幅" },
            { name: "光束 (Beam)", desc: "梯形光束形状，带垂直淡出渐变，适用于光效。", props: "长度, 顶部宽度, 底部宽度" },
            { name: "渐变 (Gradient)", desc: "支持多色标和 Gamma 校正的线性渐变。", props: "色标点, 方向 X/Y, 力度 (Gamma)" },
          ]
        },
        {
          title: "输入 (Inputs)",
          desc: "提供原始数据，如颜色、数值或外部图片。",
          items: [
            { name: "颜色 (Color)", desc: "输出一个纯色 RGBA 方块。", props: "红, 绿, 蓝" },
            { name: "数值 (Value)", desc: "输出一个灰度值 (0-1)。", props: "数值 (亮度)" },
            { name: "Alpha", desc: "输出一个不透明度值 (0-1) 或将其应用给输入节点。", props: "数值" },
            { name: "图片 (Image)", desc: "上传并输出外部图片文件。", props: "文件上传" },
          ]
        },
        {
          title: "滤镜 (Filters)",
          desc: "修改现有形状的外观。",
          items: [
            { name: "填充 (Fill)", desc: "修改形状的填充和描边属性。", props: "启用填充, 描边宽度" },
            { name: "发光 (Hard Glow)", desc: "添加多层高斯泛光效果。", props: "半径, 强度" },
            { name: "霓虹 (Neon)", desc: "强烈的轮廓发光效果。", props: "半径" },
            { name: "模糊 (Soft Blur)", desc: "简单的高斯模糊。", props: "半径" },
            { name: "描边 (Stroke)", desc: "将形状转换为轮廓线。", props: "宽度, 不透明度" },
            { name: "淡出 (Fade)", desc: "应用线性渐变透明度遮罩。", props: "角度, 起始不透明度, 结束不透明度" },
            { name: "像素化 (Pixelate)", desc: "将输入光栅化并降采样，产生复古马赛克效果。", props: "像素大小" },
          ]
        },
        {
          title: "变换 (Transforms)",
          desc: "移动、旋转或扭曲坐标空间。",
          items: [
            { name: "移动 (Translate)", desc: "沿 X 和 Y 轴移动内容。", props: "X 偏移, Y 偏移" },
            { name: "旋转 (Rotate)", desc: "围绕中心旋转内容。", props: "角度" },
            { name: "缩放 (Scale)", desc: "从中心调整大小。", props: "倍率" },
            { name: "极坐标 (Polar Coords)", desc: "在笛卡尔坐标和极坐标之间扭曲。可产生放射线或圆环效果。", props: "模式, 径向缩放, 角度缩放" },
          ]
        },
        {
          title: "数学运算 (Math)",
          desc: "使用 CSG 逻辑和混合模式组合形状。",
          items: [
            { name: "加法 (Add)", desc: "并集 (A ∪ B)。合并形状并叠加像素颜色值。", props: "输入 A, 输入 B" },
            { name: "减法 (Subtract)", desc: "差集 (A - B)。从形状 A 中减去形状 B。", props: "输入 A, 输入 B" },
            { name: "乘法 (Multiply)", desc: "交集 (A ∩ B)。只保留重叠区域。", props: "输入 A, 输入 B" },
            { name: "除法 (Divide)", desc: "排除 (A ⊕ B)。移除重叠区域（XOR 异或效果）。", props: "输入 A, 输入 B" },
          ]
        }
      ] as NodeCategory[],
      shortcuts: {
        menu: "打开节点菜单",
        delete: "删除选中项",
        pan: "平移画布",
        zoom: "缩放画布",
        multi: "多选/框选",
        tipTitle: "小技巧",
        tipText: "在空白处双击可取消所有选择。您也可以直接点击连接线（Edge）来选中并删除它们。"
      }
    }
  };

  const t = T[lang];

  return (
    <div className={clsx(
      "fixed inset-0 z-[100] bg-[#09090b]/95 backdrop-blur-xl transition-all duration-300 flex items-center justify-center",
      isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
    )}>
      <div className="w-[900px] h-[80vh] bg-[#1a1a1d] border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-2">
          <h2 className="text-xl font-bold text-white mb-6 px-2">{t.sidebar.title}</h2>
          
          <button 
            onClick={() => setActiveTab('guide')}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
              activeTab === 'guide' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Book size={16} className={activeTab === 'guide' ? "text-purple-400" : ""} />
            {t.sidebar.guide}
          </button>
          
          <button 
            onClick={() => setActiveTab('nodes')}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
              activeTab === 'nodes' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Box size={16} className={activeTab === 'nodes' ? "text-purple-400" : ""} />
            {t.sidebar.nodes}
          </button>

          <button 
            onClick={() => setActiveTab('shortcuts')}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
              activeTab === 'shortcuts' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Keyboard size={16} className={activeTab === 'shortcuts' ? "text-purple-400" : ""} />
            {t.sidebar.shortcuts}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#1a1a1d]">
          {/* Header */}
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 shrink-0">
             <span className="text-sm font-medium text-gray-500">
               {activeTab === 'guide' && t.sidebar.guide}
               {activeTab === 'nodes' && t.sidebar.nodes}
               {activeTab === 'shortcuts' && t.sidebar.shortcuts}
             </span>
             
             <div className="flex items-center gap-4">
               {/* Language Switcher */}
               <button 
                  onClick={toggleLang}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors border border-white/5"
               >
                  <Globe size={14} />
                  <span className="w-12 text-center">{lang === 'en' ? 'English' : '中文'}</span>
               </button>

               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
                 <X size={20} />
               </button>
             </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            
            {/* --- GUIDE TAB --- */}
            {activeTab === 'guide' && (
              <div className="max-w-2xl">
                <Section title={t.guide.intro.title} icon={Zap}>
                  <p>{t.guide.intro.text1}</p>
                  <p>{t.guide.intro.text2}</p>
                </Section>

                <Section title={t.guide.concepts.title} icon={Layers}>
                  <ul className="space-y-4">
                    <li className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                      <strong className="text-blue-400 block mb-1">{t.guide.concepts.vector}</strong>
                      {t.guide.concepts.vectorDesc}
                    </li>
                    <li className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                      <strong className="text-emerald-400 block mb-1">{t.guide.concepts.bitmap}</strong>
                      {t.guide.concepts.bitmapDesc}
                    </li>
                    <li className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <strong className="text-gray-200 block mb-1">{t.guide.concepts.output}</strong>
                      {t.guide.concepts.outputDesc}
                    </li>
                  </ul>
                </Section>
                
                 <Section title={t.guide.preview.title} icon={ImageIcon}>
                  <p>{t.guide.preview.text}</p>
                </Section>
              </div>
            )}

            {/* --- NODES TAB --- */}
            {activeTab === 'nodes' && (
              <div className="space-y-10">
                {(t.nodes as NodeCategory[]).map((cat, idx) => (
                  <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                     <div className="mb-4 pb-2 border-b border-white/5">
                        <h3 className="text-purple-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-purple-500" />
                           {cat.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 pl-4">{cat.desc}</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                        {cat.items.map((item, i) => (
                          <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.07] transition-all group">
                             <div className="flex justify-between items-start mb-2">
                                <div className="font-semibold text-gray-200 text-sm group-hover:text-purple-300 transition-colors">{item.name}</div>
                             </div>
                             <div className="text-xs text-gray-400 leading-relaxed mb-3">{item.desc}</div>
                             {item.props && (
                                <div className="flex items-start gap-2 pt-3 border-t border-white/5">
                                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Props</span>
                                   <span className="text-[10px] font-mono text-gray-400 bg-black/20 px-1.5 py-0.5 rounded border border-white/5">{item.props}</span>
                                </div>
                             )}
                          </div>
                        ))}
                     </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- SHORTCUTS TAB --- */}
            {activeTab === 'shortcuts' && (
              <div className="max-w-xl">
                 <div className="space-y-1">
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-gray-300">{t.shortcuts.menu}</span>
                       <div><Key>Space</Key> <span className="text-gray-500 text-xs">or</span> <Key>Right Click</Key></div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-gray-300">{t.shortcuts.delete}</span>
                       <div><Key>Delete</Key> <span className="text-gray-500 text-xs">or</span> <Key>Backspace</Key></div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-gray-300">{t.shortcuts.pan}</span>
                       <div><Key>Middle Click</Key> <span className="text-gray-500 text-xs">or</span> <Key>Space</Key> + Drag</div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-gray-300">{t.shortcuts.zoom}</span>
                       <div><Key>Mouse Wheel</Key></div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-gray-300">{t.shortcuts.multi}</span>
                       <div><Key>Shift</Key> + Drag</div>
                    </div>
                 </div>

                 <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <h4 className="flex items-center gap-2 text-purple-300 font-semibold mb-2">
                       <MousePointer2 size={16} />
                       {t.shortcuts.tipTitle}
                    </h4>
                    <p className="text-sm text-purple-200/70">
                       {t.shortcuts.tipText}
                    </p>
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpOverlay;
