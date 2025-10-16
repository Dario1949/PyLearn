import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    if (locals.user?.role !== 'teacher') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const { students, format } = await request.json();

        if (format === 'csv') {
            const csv = generateCSV(students);
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="estudiantes.csv"'
                }
            });
        } else if (format === 'pdf') {
            const html = generateHTML(students);
            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html',
                    'Content-Disposition': 'attachment; filename="estudiantes.html"'
                }
            });
        } else if (format === 'xlsx') {
            const csv = generateCSV(students);
            return new Response(csv, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': 'attachment; filename="estudiantes.xlsx"'
                }
            });
        }

        return json({ error: 'Formato no soportado' }, { status: 400 });
    } catch (error) {
        return json({ error: 'Error al exportar datos' }, { status: 500 });
    }
}

function generateCSV(students) {
    const headers = ['Nombre', 'Email', 'Progreso', 'Nivel', 'Puntos', 'Módulos Completados', 'Retos Completados', 'Estado', 'Última Actividad'];
    const rows = students.map(student => [
        student.name || '',
        student.email || '',
        `${student.progress || 0}%`,
        student.level || 1,
        student.points || 0,
        student.completedModules || 0,
        student.completedChallenges || 0,
        student.status === 'active' ? 'Activo' : 'Inactivo',
        student.lastActivity || ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    return '\uFEFF' + csvContent;
}

function generateHTML(students) {
    const rows = students.map(student => `
        <tr>
            <td>${student.name || ''}</td>
            <td>${student.email || ''}</td>
            <td>${student.progress || 0}%</td>
            <td>${student.level || 1}</td>
            <td>${student.points || 0}</td>
            <td>${student.completedModules || 0}</td>
            <td>${student.completedChallenges || 0}</td>
            <td>${student.status === 'active' ? 'Activo' : 'Inactivo'}</td>
            <td>${student.lastActivity || ''}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Estudiantes - Panel Docente</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                h1 { color: #333; }
                .stats { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>Reporte de Estudiantes - ${new Date().toLocaleDateString('es-ES')}</h1>
            <div class="stats">
                <p><strong>Total de estudiantes:</strong> ${students.length}</p>
                <p><strong>Estudiantes activos:</strong> ${students.filter(s => s.status === 'active').length}</p>
                <p><strong>Progreso promedio:</strong> ${students.length > 0 ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length) : 0}%</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Progreso</th>
                        <th>Nivel</th>
                        <th>Puntos</th>
                        <th>Módulos</th>
                        <th>Retos</th>
                        <th>Estado</th>
                        <th>Última Actividad</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>
    `;
}