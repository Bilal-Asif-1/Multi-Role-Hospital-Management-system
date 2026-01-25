import { useQuery } from '@tanstack/react-query'
import { vitalsApi } from '../../../../services/api'
import { Activity } from 'lucide-react'

interface BMICalculatorChartProps {
  patientId?: string
}

// BMI Categories with proper color scheme
// Light red (underweight) -> Green (normal) -> Orange (overweight) -> Light red (obese) -> Dark red (extremely obese)
const BMI_CATEGORIES = [
  { label: 'UNDER', min: 0, max: 18.4, color: '#f87171' }, // Light red (underweight)
  { label: 'NORMAL', min: 18.5, max: 24.9, color: '#22c55e' }, // Green (normal)
  { label: 'OVERWEIGHT', min: 25, max: 29.9, color: '#f97316' }, // Orange (overweight)
  { label: 'OBESE', min: 30, max: 34.9, color: '#f87171' }, // Light red (obese)
  { label: 'EXTREMELY OBESE', min: 35, max: 50, color: '#dc2626' }, // Dark red (extremely obese)
]

// Get color for BMI category
const getCategoryColor = (bmi: number): string => {
  for (const category of BMI_CATEGORIES) {
    if (bmi >= category.min && bmi <= category.max) {
      return category.color
    }
  }
  return BMI_CATEGORIES[BMI_CATEGORIES.length - 1].color // Default to dark red
}

// Calculate BMI from height (cm) and weight (kg)
const calculateBMI = (height: number, weight: number): number => {
  if (!height || !weight || height <= 0 || weight <= 0) return 0
  const heightInMeters = height / 100
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

// Get BMI category
const getBMICategory = (bmi: number) => {
  for (const category of BMI_CATEGORIES) {
    if (bmi >= category.min && bmi <= category.max) {
      return category
    }
  }
  return BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
}

// Calculate angle for needle
// Gauge is a semi-circle from -180 (left) to 0 (right)
// Needle starts at -90 degrees (pointing up/center)
// BMI 0 = -180 degrees (far left)
// BMI 25 (normal center) = -90 degrees (center)
// BMI 50 = 0 degrees (far right)
const calculateNeedleAngle = (bmi: number): number => {
  const minBMI = 0
  const maxBMI = 50
  const minAngle = -180 // Far left
  const maxAngle = 0 // Far right
  
  // Map BMI 0-50 to angle -180 to 0
  // Linear mapping: angle = minAngle + (bmi / maxBMI) * (maxAngle - minAngle)
  const targetAngle = minAngle + (bmi / maxBMI) * (maxAngle - minAngle)
  
  // Needle rotation is relative to -90 (center pointing up)
  // So we need to rotate from -90 to the target angle
  // For SVG transform="rotate(angle x y)", angle is the rotation from the starting position
  return targetAngle - (-90) // Rotation from center (-90) to target angle
}

export default function BMICalculatorChart({ patientId }: BMICalculatorChartProps) {
  const { data: vitals, isLoading } = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: () => vitalsApi.getAll(patientId),
    refetchInterval: 30000,
    enabled: !!patientId,
  })

  // Get latest vitals with height and weight
  const latestVital = vitals
    ?.filter((vital: any) => vital.weight && vital.height)
    .sort((a: any, b: any) => {
      return new Date(b.recordedAt || b.createdAt).getTime() - new Date(a.recordedAt || a.createdAt).getTime()
    })[0]

  const currentBMI = latestVital
    ? calculateBMI(parseFloat(latestVital.height.toString()), parseFloat(latestVital.weight.toString()))
    : 0

  const currentCategory = getBMICategory(currentBMI)
  const needleAngle = calculateNeedleAngle(currentBMI)

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!latestVital || currentBMI === 0) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">BMI Meter</h3>
        </div>
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No height and weight data available to calculate BMI.</p>
          <p className="text-sm text-gray-400 mt-2">Please update your height and weight in settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer">
      <div className="flex items-center space-x-2 mb-3">
        <Activity className="h-4 w-4 text-black" />
        <h3 className="text-base font-semibold text-gray-900">BMI Meter</h3>
      </div>

      {/* Clean BMI Gauge Meter - Larger */}
      <div className="relative w-full flex justify-center" style={{ height: '130px' }}>
        <svg viewBox="0 0 280 140" className="w-full max-w-sm h-full">
          {/* BMI Category Segments with Proper Colors */}
          {BMI_CATEGORIES.map((category, index) => {
            const startPercent = (category.min / 50) * 100
            const endPercent = (category.max / 50) * 100
            const startAngle = -180 + (startPercent * 180 / 100)
            const endAngle = -180 + (endPercent * 180 / 100)
            
            // Use category color directly
            const segmentColor = category.color
            
            const startAngleRad = (startAngle * Math.PI) / 180
            const endAngleRad = (endAngle * Math.PI) / 180
            
            const radius = 90
            const centerX = 140
            const centerY = 130
            
            const x1 = centerX + radius * Math.cos(startAngleRad)
            const y1 = centerY + radius * Math.sin(startAngleRad)
            const x2 = centerX + radius * Math.cos(endAngleRad)
            const y2 = centerY + radius * Math.sin(endAngleRad)
            
            const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0

            return (
              <path
                key={index}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                fill="none"
                stroke={segmentColor}
                strokeWidth="18"
                strokeLinecap="round"
              />
            )
          })}


          {/* Center Circle - No Text */}
          <circle cx="140" cy="130" r="26" fill="#1e3a8a" />
          <circle cx="140" cy="130" r="18" fill="#000" />

          {/* Needle/Arrow - More Visible and Properly Positioned */}
          <g transform={`rotate(${needleAngle} 140 130)`}>
            <line
              x1="140"
              y1="130"
              x2="140"
              y2="45"
              stroke="#000"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon
              points="140,45 135,55 145,55"
              fill="#000"
            />
          </g>
        </svg>
      </div>

      {/* Current BMI Display - Single Line Compact */}
      <div className="mt-6 p-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600">Current BMI:</span>
            <span className="text-lg font-bold text-gray-900">{currentBMI}</span>
            {latestVital && (
              <span className="text-xs text-gray-500">
                {parseFloat(latestVital.weight.toString())} kg | {parseFloat(latestVital.height.toString())} cm
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white bg-black"
            >
              {currentCategory.label}
            </div>
            <span className="text-xs text-gray-500">
              {currentCategory.min === 0 ? `< ${currentCategory.max}` : currentCategory.max === 50 ? `${currentCategory.min}+` : `${currentCategory.min}-${currentCategory.max}`}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
