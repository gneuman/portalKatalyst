export default function ImpactCard({ number, title, description }) {
  return (
    <div className="p-6">
      <div className="text-4xl font-bold text-blue-600 mb-2">{number}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
