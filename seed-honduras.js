import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carga las variables de entorno
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/young-group';

// Schema inline (no depende del barrel export para evitar dependencias circulares)
import { Schema } from 'mongoose';

const departmentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  isoCode: String,
}, { timestamps: true });

const municipalitySchema = new Schema({
  name: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  code: String,
}, { timestamps: true });

municipalitySchema.index({ name: 1, departmentId: 1 });

const Department = mongoose.model('Department', departmentSchema);
const Municipality = mongoose.model('Municipality', municipalitySchema);

// ── Datos de Honduras ──────────────────────────────────────────────────────────

const hondurasData = {
  "Atlántida": ["La Ceiba", "El Porvenir", "Esparta", "Jutiapa", "La Masica", "San Francisco", "Tela", "Arizona"],
  "Choluteca": ["Choluteca", "Apacilagua", "Concepción de María", "Duyure", "El Corpus", "El Triunfo", "Marcovia", "Morolica", "Namasigüe", "Orocuina", "Pespire", "San Antonio de Flores", "San Isidro", "San José", "San Marcos de Colón", "Santa Ana de Yusguare"],
  "Colón": ["Trujillo", "Balfate", "Iriona", "Limón", "Sabá", "Santa Fe", "Santa Rosa de Aguán", "Sonaguera", "Tocoa", "Bonito Oriental"],
  "Comayagua": ["Comayagua", "Ajuterique", "El Rosario", "Esquías", "Humuya", "La Libertad", "Lamaní", "La Trinidad", "Lejamaní", "Meámbar", "Minas de Oro", "Ojos de Agua", "San Jerónimo", "San José de Comayagua", "San José del Potrero", "San Luis", "Taulabé", "Villa de San Antonio", "Las Lajas", "Siguatepeque"],
  "Copán": ["Santa Rosa de Copán", "Cabañas", "Concepción", "Copán Ruinas", "Corquín", "Cucuyagua", "Dolores", "Dulce Nombre", "El Paraíso", "Florida", "La Jigua", "La Unión", "Nueva Arcadia", "San Agustín", "San Antonio", "San Jerónimo", "San José", "San Juan de Opoa", "San Nicolás", "San Pedro", "Santa Rita", "Trinidad de Copán", "Veracruz"],
  "Cortés": ["San Pedro Sula", "Choloma", "Omoa", "Pimienta", "Potrerillos", "Puerto Cortés", "San Antonio de Cortés", "San Francisco de Yojoa", "San Manuel", "Santa Cruz de Yojoa", "Villanueva", "La Lima"],
  "El Paraíso": ["Yuscarán", "Alauca", "Danlí", "El Paraíso", "Güinope", "Jacaleapa", "Liure", "Morocelí", "Oropolí", "Potrerillos", "San Antonio de Flores", "San Lucas", "San Matías", "Soledad", "Teupasenti", "Texiguat", "Trojes", "Vado Ancho", "Yauyupe"],
  "Francisco Morazán": ["Tegucigalpa", "Alubarén", "Cedros", "Curarén", "El Porvenir", "Guaimaca", "La Libertad", "La Venta", "Lepaterique", "Maraita", "Marale", "Nueva Armenia", "Ojojona", "Orica", "Reitoca", "Sabanagrande", "San Antonio de Oriente", "San Buenaventura", "San Ignacio", "San Juan de Flores", "San Miguelito", "Santa Ana", "Santa Lucía", "Talanga", "Tatumbla", "Valle de Ángeles", "Villa de San Francisco", "Vallecillo"],
  "Gracias a Dios": ["Puerto Lempira", "Brus Laguna", "Ahuas", "Juan Francisco Bulnes", "Villeda Morales", "Wampusirpi"],
  "Intibucá": ["La Esperanza", "Camasca", "Colomoncagua", "Concepción", "Dolores", "Intibucá", "Jesús de Otoro", "Magdalena", "Masaguara", "San Antonio", "San Isidro", "San Juan", "San Marcos de la Sierra", "San Miguel Guancapla", "Santa Lucía", "Yamaranguila", "San Francisco de Opalaca"],
  "Islas de la Bahía": ["Roatán", "Guanaja", "José Santos Guardiola", "Utila"],
  "La Paz": ["La Paz", "Aguanqueterique", "Cabañas", "Cane", "Chinacla", "Guajiquiro", "Lauterique", "Marcala", "Mercedes de Oriente", "San Antonio del Norte", "San José", "San Juan", "San Pedro de Tutule", "Santa Ana", "Santa Elena", "Santa María", "Santiago de Puringla", "Yarula"],
  "Lempira": ["Gracias", "Belén", "Candelaria", "Cololaca", "Erandique", "Gualcince", "Guarita", "La Campa", "La Iguala", "Las Flores", "La Unión", "La Virtud", "Lepaera", "Mapulaca", "Piraera", "San Andrés", "San Francisco", "San Juan Guarita", "San Manuel Colohete", "San Rafael", "San Sebastián", "Santa Cruz", "Talgua", "Tambla", "Tomalá", "Valladolid", "Virginia", "San Marcos de Caiquín"],
  "Ocotepeque": ["Ocotepeque", "Belén Gualcho", "Concepción", "Dolores Merendón", "Fraternidad", "La Encarnación", "La Labor", "Lucerna", "Mercedes", "San Fernando", "San Francisco del Valle", "San Jorge", "San Marcos", "Santa Fe", "Sinuapa", "Sensenti"],
  "Olancho": ["Juticalpa", "Campamento", "Catacamas", "Concordia", "Dulce Nombre de Culmí", "El Rosario", "Esquipulas del Norte", "Gualaco", "Guarizama", "Guata", "Jano", "La Unión", "Mangulile", "Manto", "Patuca", "Salamá", "San Esteban", "San Francisco de Becerra", "San Francisco de La Paz", "Santa María del Real", "Silca", "Yocón"],
  "Santa Bárbara": ["Santa Bárbara", "Arada", "Atima", "Azacualpa", "Ceguaca", "Colinas", "Concepción del Norte", "Concepción del Sur", "Chinda", "El Nispero", "Gualala", "Ilama", "Macuelizo", "Naranjito", "Nuevo Celilac", "Petoa", "Protección", "Quimistán", "San Francisco de Ojuera", "San Luis", "San Marcos", "San Nicolás", "San Pedro Zacapa", "Santa Rita", "San Vicente Centenario", "Trinidad", "Las Vegas", "Nueva Frontera"],
  "Valle": ["Nacaome", "Alianza", "Amapala", "Aramecina", "Caridad", "Goascorán", "Langue", "San Francisco de Coray", "San Lorenzo"],
  "Yoro": ["Yoro", "Arenal", "El Negrito", "El Progreso", "Jocón", "Morazán", "Olanchito", "Santa Rita", "Sulaco", "Victoria", "Yorito"]
};

// ── Seed ───────────────────────────────────────────────────────────────────────

async function seedHonduras() {
  console.log('⏳ Conectando a MongoDB...');
  console.log('   URI:', MONGO_URI);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a la base de datos\n');

  // Limpiar colecciones
  await Department.deleteMany({});
  await Municipality.deleteMany({});
  console.log('🗑️  Colecciones limpiadas\n');

  let totalMunis = 0;

  for (const [deptName, munis] of Object.entries(hondurasData)) {
    const dept = await Department.create({ name: deptName, isoCode: '' });

    const docs = munis.map((name) => ({
      name,
      departmentId: dept._id,
    }));

    await Municipality.insertMany(docs);
    totalMunis += docs.length;

    console.log(`   ✓ ${deptName}: ${docs.length} municipios`);
  }

  console.log(`\n🎉 Listo. ${Object.keys(hondurasData).length} departamentos, ${totalMunis} municipios.`);

  await mongoose.disconnect();
  process.exit(0);
}

seedHonduras().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error('   ¿MongoDB está corriendo? Ejecuta: mongod --dbpath /data/db');
  process.exit(1);
});