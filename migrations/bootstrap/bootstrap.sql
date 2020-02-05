CREATE USER 'calendarworker'@'%' IDENTIFIED BY 'calendarworker';
ALTER USER 'calendarworker'@'%' IDENTIFIED WITH mysql_native_password BY 'calendarworker';
GRANT ALL PRIVILEGES ON season_data.* TO 'calendarworker'@'%';
GRANT ALL PRIVILEGES ON user_data.* TO 'calendarworker'@'%';
