export const structures = [
  { id: 'brain', name: 'Brain', system: 'Nervous', color: '#c68eac', description: 'The brain processes sensory information and coordinates movement, thought and memory.', location: 'Within the skull.', coverage: 'Combined brain structures; individual lobes and nerves are not separately selectable.' },
  { id: 'heart', name: 'Heart', system: 'Circulatory', color: '#b94b61', description: 'A muscular organ that pumps blood through the pulmonary and systemic circulations.', location: 'In the chest, between the lungs.', coverage: 'One simplified heart surface; chambers, valves and coronary vessels are not separated.' },
  { id: 'lungs', name: 'Lungs', system: 'Respiratory', color: '#709dc0', description: 'The lungs provide the surfaces where oxygen and carbon dioxide are exchanged between air and blood.', location: 'On either side of the heart in the chest.', coverage: 'Both lungs form one selection group; lobes, bronchi and alveoli are not separately selectable.' },
  { id: 'liver', name: 'Liver', system: 'Digestive', color: '#965878', description: 'The liver processes absorbed nutrients and produces bile, which contributes to fat digestion.', location: 'Mainly in the upper right abdomen, beneath the diaphragm.', coverage: 'A simplified liver surface; lobes and internal vessels are not separated.' },
  { id: 'stomach', name: 'Stomach', system: 'Digestive', color: '#d88e93', description: 'The stomach stores food and mixes it with digestive secretions before passing it to the small intestine.', location: 'In the upper left abdomen.', coverage: 'External shape only; tissue layers and internal anatomy are not separated.' },
  { id: 'pancreas', name: 'Pancreas', system: 'Digestive', color: '#c3a54d', description: 'The pancreas supplies digestive enzymes and produces hormones including insulin and glucagon.', location: 'Behind the stomach in the upper abdomen.', coverage: 'One surface; ducts, endocrine cells and tissue layers are not separated.' },
  { id: 'kidneys', name: 'Kidneys', system: 'Urinary', color: '#a7606c', description: 'The kidneys filter blood and help regulate fluid and electrolyte balance by forming urine.', location: 'Along the back of the abdomen, one on each side of the spine.', coverage: 'Both kidneys form one selection group; nephrons and internal regions are not separated.' },
  { id: 'intestines', name: 'Intestines', system: 'Digestive', color: '#bb8b72', description: 'The small intestine absorbs most nutrients. The large intestine absorbs water and forms stool.', location: 'In the abdomen and pelvis.', coverage: 'Combined intestinal meshes; individual segments are not separately selectable.' },
  { id: 'skeleton', name: 'Thoracic skeleton', system: 'Skeletal', color: '#c7c8bc', description: 'This chest assembly shows the relationship of the rib cage, sternum, clavicles and thoracic spine to the organs.', location: 'Chest and shoulder region.', coverage: 'A merged chest assembly, not a full skeleton. Individual bones cannot be selected.' },
  { id: 'vascular', name: 'Major vessels', system: 'Circulatory', color: '#b75255', description: 'This assembly shows selected major blood vessels in relation to the heart and abdominal organs.', location: 'Chest, neck and upper abdomen.', coverage: 'A merged subset of vessels, not the complete circulation. Individual vessels cannot be selected.' },
] as const;

export type StructureId = typeof structures[number]['id'];
export const bodySystems = ['All systems', 'Nervous', 'Circulatory', 'Respiratory', 'Digestive', 'Urinary', 'Skeletal'] as const;
export type Bounds = { center: [number, number, number]; size: [number, number, number] };
export const fullBody: Bounds = { center: [0, 0, 0], size: [1.91, 4.8, .83] };

export function fitDistance(bounds: Bounds, aspect: number, fov: number) {
  const tangent = Math.tan(fov * Math.PI / 360);
  return (Math.max(bounds.size[1], bounds.size[0] / Math.max(aspect, .1)) / (2 * tangent) + bounds.size[2] / 2) * 1.18;
}
