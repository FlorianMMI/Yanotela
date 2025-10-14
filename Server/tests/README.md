voir le rôle pour chaque note :

docker exec yanotela-db-local psql -U yanotela_local -d yanotela_local -c "SELECT n.\"Titre\", n.id as note_id, u.pseudo, p.role, CASE WHEN p.role = 0 THEN '👑 Propriétaire' WHEN p.role = 1 THEN '⚙️ Admin' WHEN p.role = 2 THEN '✏️ Éditeur' WHEN p.role = 3 THEN '👁️ Lecteur' END as role_name FROM \"Note\" n LEFT JOIN \"Permission\" p ON n.id = p.id_note LEFT JOIN \"User\" u ON p.id_user = u.id ORDER BY n.\"ModifiedAt\" DESC LIMIT 20;"

voir les logs des containers : 

docker compose -f docker-compose.preprod.yml logs -f