// Shared extraction taxonomy. Documented values are stored separately.
export const habitats = ['All habitats', 'Spacecraft', 'Space station', 'Lunar base', 'Martian base', 'Pressurized rover'];

export const taxonomy = [
  { id: 'environment', name: 'Environment and conditions', icon: 'orbit', subcategories: [
    { name: 'Gravity', variables: ['Gravity level', 'Residual acceleration', 'Microgravity duration', 'Simulation method'] },
    { name: 'Atmosphere', variables: ['O₂ concentration', 'Total pressure', 'O₂ partial pressure', 'Initial temperature', 'Diluent gas', 'Relative humidity'] },
    { name: 'Ventilation', variables: ['Air speed', 'Flow direction', 'Flow rate', 'Flow regime'] },
    { name: 'Confinement', variables: ['Free volume', 'Chamber dimensions', 'Boundary conditions', 'Applied electric field'] },
  ] },
  { id: 'fuel', name: 'Materials and fuels', icon: 'layers', subcategories: [
    { name: 'Identity and composition', variables: ['Fuel name', 'Physical state', 'Composition', 'Concentration', 'Carrier gas'] },
    { name: 'Sample geometry', variables: ['Shape', 'Thickness', 'Diameter', 'Length', 'Orientation', 'Support'] },
    { name: 'Properties', variables: ['Density', 'Thermal conductivity', 'Specific heat', 'Emissivity', 'Heat of combustion'] },
    { name: 'Preparation', variables: ['Conditioning', 'Initial mass', 'Initial temperature', 'Surface treatment'] },
  ] },
  { id: 'fire', name: 'Fire behavior', icon: 'flame', subcategories: [
    { name: 'Ignition and limits', variables: ['Ignition source', 'Ignition energy', 'Ignition time', 'Oxygen limit', 'Flammability criterion'] },
    { name: 'Spread and stability', variables: ['Spread rate', 'Flame height', 'Flame temperature', 'Lift-off', 'Oscillation'] },
    { name: 'Consumption and products', variables: ['Mass loss', 'Burning rate', 'Heat release', 'CO', 'CO₂', 'Soot', 'Particle size'] },
    { name: 'Extinction', variables: ['Extinction time', 'Extinction concentration', 'Reignition', 'Cool flames'] },
  ] },
  { id: 'safety', name: 'Safety systems', icon: 'shield', subcategories: [
    { name: 'Detection', variables: ['Detector type', 'Detected variable', 'Threshold', 'Response time', 'False alarms'] },
    { name: 'Suppression', variables: ['Extinguishing agent', 'Applied concentration', 'Discharge flow rate', 'Discharge time', 'Location'] },
    { name: 'Technology application', variables: ['Safety function', 'Equipment informed by the finding', 'Validation evidence', 'Transfer limitations'] },
  ] },
  { id: 'evidence', name: 'Evidence and quality', icon: 'file', subcategories: [
    { name: 'Traceability', variables: ['DOI or URL', 'Investigation', 'Document', 'Test', 'Page', 'Table or figure', 'Version'] },
    { name: 'Experimental design', variables: ['Objective', 'Modified variables', 'Constant variables', 'Replicates', 'Comparison group'] },
    { name: 'Instrumentation', variables: ['Sensor', 'Measured quantity', 'Range', 'Resolution', 'Sampling frequency', 'Calibration'] },
    { name: 'Quality and limits', variables: ['Uncertainty', 'Missing data', 'Extraction method', 'Human review', 'Application domain'] },
  ] },
];

