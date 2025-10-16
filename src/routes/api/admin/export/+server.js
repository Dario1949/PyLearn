import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    if (locals.user?.role !== 'admin') {
        return json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    try {
        const { users, format } = await request.json();

        if (format === 'csv') {
            const csv = generateCSV(users);
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="estudiantes.csv"'
                }
            });
        } else if (format === 'pdf') {
            const html = generateHTML(users);
            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html',
                    'Content-Disposition': 'attachment; filename="estudiantes.html"'
                }
            });
        } else if (format === 'xlsx') {
            const csv = generateCSV(users);
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

function generateCSV(users) {
    const headers = ['Nombre', 'Email', 'Rol', 'Programa', 'Fecha Registro'];
    const rows = users.map(user => [
        user.name || '',
        user.email || '',
        user.role === 'admin' ? 'Administrador' : user.role === 'teacher' ? 'Docente' : 'Estudiante',
        user.program || 'No especificado',
        user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    return '\uFEFF' + csvContent; // BOM para UTF-8
}

function generateHTML(users) {
    const rows = users.map(user => `
        <tr>
            <td>${user.name || ''}</td>
            <td>${user.email || ''}</td>
            <td>${user.role === 'admin' ? 'Administrador' : user.role === 'teacher' ? 'Docente' : 'Estudiante'}</td>
            <td>${user.program || 'No especificado'}</td>
            <td>${user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : ''}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Estudiantes</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                h1 { color: #333; }
            </style>
        </head>
        <body>
            <h1>Reporte de Estudiantes - ${new Date().toLocaleDateString('es-ES')}</h1>
            <p>Total de usuarios: ${users.length}</p>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Programa</th>
                        <th>Fecha Registro</th>
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