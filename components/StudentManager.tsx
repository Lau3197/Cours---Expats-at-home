import React, { useState, useEffect } from 'react';
import {
    Loader2,
    Search,
    User,
    Award,
    Clock,
    CheckCircle,
    X,
    TrendingUp,
    Calendar,
    Mail,
    Eye
} from 'lucide-react';
import { Course, CoursePackage, Plan } from '../types';
import { getAllStudents, StudentData, updateStudentPlan } from '../services/admin';
import { useAuth } from '../context/AuthContext';

interface StudentManagerProps {
    courses: CoursePackage[]; // Need full packages to resolve lesson names
}

const StudentManager: React.FC<StudentManagerProps> = ({ courses: coursePackages }) => {
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
    const { impersonateUser } = useAuth();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await getAllStudents();
            setStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = async (uid: string, newPlan: Plan) => {
        try {
            await updateStudentPlan(uid, newPlan);
            setStudents(students.map(s => s.uid === uid ? { ...s, plan: newPlan } : s));
            if (selectedStudent && selectedStudent.uid === uid) {
                setSelectedStudent({ ...selectedStudent, plan: newPlan });
            }
        } catch (error) {
            alert("Erreur lors de la mise à jour du plan");
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatus = (lastLogin: string | undefined): 'Active' | 'Inactive' => {
        if (!lastLogin || lastLogin === 'Jamais' || lastLogin === 'Inconnue') return 'Inactive';
        const date = new Date(lastLogin);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30 ? 'Active' : 'Inactive';
    };

    const resolveLessonName = (lessonKey: string) => {
        // key format: courseId_lessonId
        // This is tricky if ID contains underscore, but assuming standard format
        // Better to iterate all courses and find matching Ids
        for (const pkg of coursePackages) {
            if (lessonKey.startsWith(pkg.id)) {
                // Try to find lesson
                for (const section of pkg.sections) {
                    const lesson = section.lessons.find(l => `${pkg.id}_${l.id}` === lessonKey);
                    if (lesson) return { courseName: pkg.title, lessonName: lesson.title, level: pkg.level };
                }
            }
        }
        return { courseName: 'Unknown Course', lessonName: lessonKey, level: '?' };
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">Annuaire des Étudiants</h2>
                    <p className="text-[#5A6B70]/60 sans-handwritten text-lg">Suivez la progression de vos élèves</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B70]/40" />
                    <input
                        type="text"
                        placeholder="Rechercher un élève..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white border-none rounded-xl py-3 pl-10 pr-4 w-64 focus:ring-2 focus:ring-[#dd8b8b] font-medium text-[#5A6B70] shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 text-[#dd8b8b] animate-spin" />
                </div>
            ) : (
                <div className="bg-white rounded-[40px] border border-[#dd8b8b]/10 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#F9F7F2]">
                            <tr className="text-left">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">Étudiant</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">Niveau Cible</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">Formule</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">Dernière Connexion</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">Progression</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dd8b8b]/10">
                            {filteredStudents.map((student) => {
                                const status = getStatus(student.lastLogin);
                                return (
                                    <tr
                                        key={student.uid}
                                        onClick={() => setSelectedStudent(student)}
                                        className="hover:bg-[#F9F7F2]/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#dd8b8b]/10 flex items-center justify-center text-[#dd8b8b] font-bold">
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[#5A6B70]">{student.name}</div>
                                                    <div className="text-xs text-[#5A6B70]/60">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="bg-[#E8C586]/20 text-[#E8C586] px-3 py-1 rounded-full text-xs font-black">
                                                {student.levelGoal || 'A1'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${student.plan === 'booster' ? 'bg-purple-100 text-purple-600' : student.plan === 'integration' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {student.plan || 'Autonomie'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-[#5A6B70]/60">
                                            {student.lastLogin && student.lastLogin !== 'Jamais' && student.lastLogin !== 'Inconnue'
                                                ? new Date(student.lastLogin).toLocaleDateString()
                                                : 'Jamais'}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-[#F9F7F2] rounded-full overflow-hidden">
                                                    {/* Rough progress estimate: calculated from total known lessons vs completed */}
                                                    {/* For simply list, just showing count */}
                                                    <div
                                                        className="h-full bg-[#dd8b8b]"
                                                        style={{ width: `${Math.min(100, (student.stats?.completedLessonsCount || 0) * 2)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black flex w-fit items-center gap-1 ${status === 'Active'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                <div className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                {status === 'Active' ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    impersonateUser(student.uid);
                                                }}
                                                className="p-2 rounded-full hover:bg-[#F9F7F2] text-[#5A6B70] hover:text-[#dd8b8b] transition-colors"
                                                title="Se connecter en tant que cet élève"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* DETAIL MODAL */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-[#5A6B70]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-[#dd8b8b]/10 flex justify-between items-start bg-[#F9F7F2]/50">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-white border-4 border-[#dd8b8b]/20 shadow-lg flex items-center justify-center overflow-hidden">
                                    {selectedStudent.avatar ? (
                                        <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-[#dd8b8b]" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">
                                        {selectedStudent.name}
                                    </h2>
                                    <div className="flex items-center gap-4 mt-2 text-[#5A6B70]/60">
                                        <span className="flex items-center gap-1 text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                                            <Mail className="w-3 h-3" /> {selectedStudent.email}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                                            <Clock className="w-3 h-3" /> Dernière connexion: {selectedStudent.lastLogin && selectedStudent.lastLogin !== 'Jamais' ? new Date(selectedStudent.lastLogin).toLocaleDateString() : 'Jamais'}
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-xs font-bold text-[#5A6B70] uppercase mr-2">Formule :</label>
                                        <select
                                            value={selectedStudent.plan || 'autonomy'}
                                            onChange={(e) => handlePlanChange(selectedStudent.uid, e.target.value as Plan)}
                                            className="bg-[#F9F7F2] border-none rounded-lg text-sm font-bold text-[#5A6B70] focus:ring-[#dd8b8b]"
                                        >
                                            <option value="autonomy">Autonomie (Base)</option>
                                            <option value="integration">L'Intégration (+ Programme)</option>
                                            <option value="booster">Booster Belge (+ Coaching)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-2 hover:bg-[#dd8b8b]/10 rounded-full transition-colors text-[#5A6B70]/40"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 bg-[#F9F7F2]/30 flex-1">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-[#dd8b8b]/10 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2 text-[#dd8b8b]">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-bold text-sm uppercase tracking-wider">Leçons Complétées</span>
                                    </div>
                                    <div className="text-3xl font-black text-[#5A6B70]">{selectedStudent.stats?.completedLessonsCount || 0}</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-[#dd8b8b]/10 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2 text-[#E8C586]">
                                        <Clock className="w-5 h-5" />
                                        <span className="font-bold text-sm uppercase tracking-wider">Heures d'Étude</span>
                                    </div>
                                    <div className="text-3xl font-black text-[#5A6B70]">{selectedStudent.progress?.learningHours ? Math.round(selectedStudent.progress.learningHours * 10) / 10 : 0}h</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-[#dd8b8b]/10 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2 text-green-500">
                                        <TrendingUp className="w-5 h-5" />
                                        <span className="font-bold text-sm uppercase tracking-wider">Niveau</span>
                                    </div>
                                    <div className="text-3xl font-black text-[#5A6B70]">{selectedStudent.levelGoal || 'A1'}</div>
                                </div>
                            </div>

                            {/* Detailed Progress List */}
                            <div>
                                <h3 className="text-xl font-bold text-[#5A6B70] mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#dd8b8b]" /> Historique des leçons
                                </h3>
                                <div className="bg-white rounded-2xl border border-[#dd8b8b]/10 overflow-hidden">
                                    {selectedStudent.progress?.completedLessons && selectedStudent.progress.completedLessons.length > 0 ? (
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {selectedStudent.progress.completedLessons.map((lessonKey, index) => {
                                                const details = resolveLessonName(lessonKey);
                                                return (
                                                    <div key={index} className="px-6 py-4 border-b border-[#dd8b8b]/10 last:border-0 hover:bg-[#F9F7F2] transition-colors flex justify-between items-center bg-white">
                                                        <div>
                                                            <div className="font-bold text-[#5A6B70]">{details.lessonName}</div>
                                                            <div className="text-xs text-[#5A6B70]/60 uppercase tracking-wider mt-1">
                                                                <span className="bg-[#dd8b8b]/10 text-[#dd8b8b] px-1.5 py-0.5 rounded mr-2">{details.level}</span>
                                                                {details.courseName}
                                                            </div>
                                                        </div>
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-[#5A6B70]/40 italic">
                                            Aucune leçon terminée pour le moment.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManager;
