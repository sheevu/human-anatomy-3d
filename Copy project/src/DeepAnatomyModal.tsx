import React, { useState, useMemo } from 'react';
import {
  Search,
  Database,
  Layers,
  Eye,
  X,
  ChevronRight,
  HardDrive,
  Activity,
  Heart,
  Info
} from 'lucide-react';
import bp3dCatalog from './data/bp3dCatalog.json';

interface BP3DEntry {
  fileId: string;
  name: string;
  fmaId: string;
  representationId: string;
  volumeCm3: number;
  category: string;
}

interface DeepAnatomyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrgan?: (organKey: string) => void;
  hi?: boolean;
}

export function DeepAnatomyModal({
  isOpen,
  onClose,
  onSelectOrgan,
  hi = false,
}: DeepAnatomyModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<BP3DEntry | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (bp3dCatalog as BP3DEntry[]).forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['all', ...Array.from(set)];
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (bp3dCatalog as BP3DEntry[]).filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.fmaId && item.fmaId.toLowerCase().includes(q)) ||
        (item.fileId && item.fileId.toLowerCase().includes(q));
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  // Correlate BP3D structure with major organ in 3D viewer
  const mapToOrganKey = (item: BP3DEntry): string | null => {
    const n = item.name.toLowerCase();
    if (n.includes('heart') || n.includes('coronary') || n.includes('aorta')) return 'heart';
    if (n.includes('brain') || n.includes('cerebr') || n.includes('cranial')) return 'brain';
    if (n.includes('lung') || n.includes('bronch') || n.includes('pulmon')) return 'lungs';
    if (n.includes('liver') || n.includes('hepat')) return 'liver';
    if (n.includes('stomach') || n.includes('gastr')) return 'stomach';
    if (n.includes('kidney') || n.includes('renal')) return 'kidneys';
    if (n.includes('pancrea')) return 'pancreas';
    if (n.includes('intestin') || n.includes('colon') || n.includes('bowel') || n.includes('mesenter')) return 'intestines';
    return null;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(10, 18, 14, 0.82)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          height: '84vh',
          backgroundColor: '#0f1715',
          border: '1px solid #1f362c',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          color: '#e4ebe6',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1f362c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0a100e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '12px',
                backgroundColor: '#133526',
                border: '1px solid #287a55',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f0fdf4' }}>
                  {hi ? 'बॉडीपार्ट्स3D व Z-एनाटॉमी विस्तृत संरचना कैटलॉग' : 'BodyParts3D & Z-Anatomy Deep Catalog'}
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#1b4332',
                    color: '#86efac',
                    border: '1px solid #2d6a4f',
                  }}
                >
                  {bp3dCatalog.length} {hi ? 'संरचनाएं' : 'Structures'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a39b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={13} color="#2dd4bf" />
                <span>Source: Z-Anatomy & BodyParts3D (DBCLS CC BY-SA 2.1 JP)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: '8px',
              borderRadius: '10px',
              backgroundColor: '#162520',
              border: '1px solid #233b31',
              color: '#94a39b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search and Category Filters */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #1f362c',
            backgroundColor: '#0c1412',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#657d72',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                hi
                  ? 'संरचना खोजें (जैसे Aorta, Femur, Renal, Rib, Carotid, Portal vein)...'
                  : 'Search 2,234 structures by anatomical name, FMA ID, or mesh ID...'
              }
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                backgroundColor: '#080d0c',
                border: '1px solid #1f362c',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#f0fdf4',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: selectedCategory === cat ? '1px solid #34d399' : '1px solid #233b31',
                  backgroundColor: selectedCategory === cat ? '#065f46' : '#14231d',
                  color: selectedCategory === cat ? '#ffffff' : '#94a39b',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat === 'all' ? (hi ? 'सभी श्रेणियां' : 'All Categories') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Split: List & Inspection Drawer */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', overflow: 'hidden' }}>
          {/* List Area */}
          <div style={{ overflowY: 'auto', padding: '12px', borderRight: '1px solid #1f362c' }}>
            {filteredItems.slice(0, 80).map((item) => {
              const isSelected = selectedItem?.fileId === item.fileId;
              const relatedOrgan = mapToOrganKey(item);

              return (
                <div
                  key={item.fileId}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    backgroundColor: isSelected ? '#123828' : 'rgba(20, 35, 29, 0.4)',
                    border: isSelected ? '1px solid #22c55e' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#f0fdf4' }}>
                        {item.name}
                      </span>
                      {relatedOrgan && (
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 700,
                            backgroundColor: '#064e3b',
                            color: '#6ee7b7',
                            border: '1px solid #047857',
                            textTransform: 'uppercase',
                          }}
                        >
                          {relatedOrgan}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#688275', fontFamily: 'monospace' }}>
                      <span>{item.fileId}.obj</span>
                      <span>•</span>
                      <span>{item.fmaId}</span>
                      <span>•</span>
                      <span style={{ color: '#2dd4bf', fontFamily: 'sans-serif' }}>{item.category}</span>
                    </div>
                  </div>

                  <ChevronRight size={15} color="#527061" style={{ flexShrink: 0 }} />
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#688275', fontSize: '13px' }}>
                {hi ? 'कोई मेल खाती शारीरिक संरचना नहीं मिली।' : 'No matching anatomical structures found.'}
              </div>
            )}
          </div>

          {/* Right Detail Pane */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#0a100e',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            {selectedItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ borderBottom: '1px solid #1f362c', paddingBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#34d399',
                    }}
                  >
                    {selectedItem.category}
                  </span>
                  <h4 style={{ margin: '6px 0 2px', fontSize: '18px', fontWeight: 900, color: '#f0fdf4' }}>
                    {selectedItem.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#88a395', fontFamily: 'monospace' }}>
                    Concept ID: {selectedItem.fmaId}
                  </p>
                </div>

                {/* Technical Specifications */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#121f1a',
                      border: '1px solid #1b3329',
                    }}
                  >
                    <span style={{ color: '#88a395' }}>File Reference:</span>
                    <span style={{ fontFamily: 'monospace', color: '#6ee7b7', fontWeight: 600 }}>{selectedItem.fileId}.obj</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#121f1a',
                      border: '1px solid #1b3329',
                    }}
                  >
                    <span style={{ color: '#88a395' }}>Representation ID:</span>
                    <span style={{ fontFamily: 'monospace', color: '#f0fdf4' }}>{selectedItem.representationId || 'N/A'}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#121f1a',
                      border: '1px solid #1b3329',
                    }}
                  >
                    <span style={{ color: '#88a395' }}>Volume:</span>
                    <span style={{ fontFamily: 'monospace', color: '#f0fdf4' }}>{selectedItem.volumeCm3 ? `${selectedItem.volumeCm3} cm³` : 'N/A'}</span>
                  </div>
                </div>

                {/* 3D Action */}
                {mapToOrganKey(selectedItem) && (
                  <div style={{ paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const org = mapToOrganKey(selectedItem);
                        if (org && onSelectOrgan) {
                          onSelectOrgan(org);
                          onClose();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        backgroundColor: '#15803d',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(21, 128, 61, 0.4)',
                      }}
                    >
                      <Eye size={16} />
                      <span>{hi ? '3D मॉडल पर मुख्य अंग देखें' : `Focus ${mapToOrganKey(selectedItem)?.toUpperCase()} in 3D Body`}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', color: '#688275', gap: '10px' }}>
                <Layers size={32} color="#3d584b" />
                <p style={{ fontSize: '12px', margin: 0 }}>
                  {hi ? 'संरचना विवरण देखने के लिए सूची से किसी अंग पर क्लिक करें' : 'Select any anatomical element from the list to view volume and 3D organ links.'}
                </p>
              </div>
            )}

            <div style={{ paddingTop: '12px', borderTop: '1px solid #1f362c', fontSize: '10px', color: '#566e61' }}>
              BodyParts3D & Z-Anatomy © Database Center for Life Science (DBCLS), CC Attribution-Share Alike 2.1 Japan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
