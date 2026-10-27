insert into users(role,name,email,password_hash,enrollment,branch,year,career_goal,skills) values
 ('STUDENT','Priyadarshini Rao','priya@nietstudent.in',crypt('student123',gen_salt('bf',8)),'NIET2024001','CSE (AI)','3rd Year','AI/ML Engineer','{Java,Python,Machine Learning}'),
 ('STUDENT','Rohan Mehta','rohan@nietstudent.in',crypt('student123',gen_salt('bf',8)),'NIET2024002','CSE','3rd Year','Software Engineer','{Java,React,SQL}');
insert into users(role,name,email,password_hash,grad_year,branch,company,job_role,industry,location,skills,open_mentorship,open_referrals) values
 ('ALUMNI','Rahul Sharma','rahul@alumni.com',crypt('alumni123',gen_salt('bf',8)),'2022','CSE (AI)','Google','AI/ML Engineer','Technology','Bangalore','{Python,Machine Learning,Cloud}',true,true),
 ('ALUMNI','Ananya Verma','ananya@alumni.com',crypt('alumni123',gen_salt('bf',8)),'2021','CSE','Microsoft','Software Engineer','Technology','Hyderabad','{Java,C++,Cloud}',true,false),
 ('ALUMNI','Aman Gupta','aman@alumni.com',crypt('alumni123',gen_salt('bf',8)),'2020','IT','Deloitte','Data Scientist','Consulting','Delhi NCR','{Python,Data Science,SQL}',false,true),
 ('ALUMNI','Neha Singh','neha@alumni.com',crypt('alumni123',gen_salt('bf',8)),'2023','CSE','Amazon','Product Manager','E-commerce','Remote','{SQL,UI/UX,Cloud}',true,true);
insert into users(role,name,email,password_hash) values ('ADMIN','Administrator','admin@alumnet.com',crypt('admin123',gen_salt('bf',8)));

with h as (select crypt('student123',gen_salt('bf',8)) p),
 s as (select array['Aarav','Aditi','Akash','Ananya','Arjun','Diya','Ishaan','Kavya','Neha','Rohan','Rahul','Priya','Sana','Vikram','Meera','Karan','Nisha','Aditya','Pooja','Varun'] f,
 array['Sharma','Verma','Gupta','Singh','Mehta','Rao','Kumar','Patel','Das','Nair','Jain','Reddy','Malhotra','Shah','Mishra'] l,
 array['CSE','CSE (AI)','Information Technology','Electronics','Electrical Engineering','Mechanical Engineering'] b,
 array['Java,Python,Machine Learning','JavaScript,React,HTML','Python,Data Science,SQL','C++,Algorithms,Problem Solving','Java,Spring,Databases','Cloud,Linux,Networking','Figma,UI/UX,Prototyping','Python,AI,Statistics'] k)
insert into users(role,name,email,password_hash,enrollment,branch,year,career_goal,skills)
select 'STUDENT', f[1+(i-1)%20]||' '||l[1+(i*3)%15], 'student'||i||'@nietstudent.in', p, 'NIET2024'||lpad(i::text,4,'0'),
 b[1+(i-1)%6], (array['1st Year','2nd Year','3rd Year','4th Year'])[1+(i-1)%4],
 (array['Software Engineer','AI/ML Engineer','Data Scientist','Web Developer','Product Manager','Cybersecurity Analyst','Cloud Engineer','UI/UX Designer'])[1+(i-1)%8],
 string_to_array(k[1+(i-1)%8],',')
from s, h, generate_series(3,250) i;

with h as (select crypt('alumni123',gen_salt('bf',8)) p),
 s as (select array['Aarav','Aditi','Akash','Ananya','Arjun','Diya','Ishaan','Kavya','Neha','Rohan','Rahul','Priya','Sana','Vikram','Meera','Karan','Nisha','Aditya','Pooja','Varun'] f,
 array['Sharma','Verma','Gupta','Singh','Mehta','Rao','Kumar','Patel','Das','Nair','Jain','Reddy','Malhotra','Shah','Mishra'] l,
 array['CSE','CSE (AI)','Information Technology','Electronics','Electrical Engineering','Mechanical Engineering'] b,
 array['Java,Python,Machine Learning','JavaScript,React,HTML','Python,Data Science,SQL','C++,Algorithms,Problem Solving','Java,Spring,Databases','Cloud,Linux,Networking','Figma,UI/UX,Prototyping','Python,AI,Statistics'] k)
insert into users(role,name,email,password_hash,grad_year,branch,company,job_role,industry,location,skills,open_mentorship,open_referrals)
select 'ALUMNI', f[1+(i+4)%20]||' '||l[1+(i*2+1)%15], 'alumni'||i||'@alumni.com', p, (2015+i%10)::text, b[1+(i-1)%6],
 (array['Google','Microsoft','Amazon','TCS','Infosys','Wipro','Adobe','Accenture','Deloitte','IBM','Oracle','Flipkart','Paytm','Zoho','Cognizant'])[1+(i-1)%15],
 (array['Software Engineer','AI/ML Engineer','Data Scientist','Product Manager','Cloud Engineer','Business Analyst','Frontend Developer','Cybersecurity Analyst','Data Engineer','UX Designer'])[1+(i-1)%10],
 (array['Technology','Finance','Healthcare','Consulting','E-commerce','Education'])[1+(i-1)%6],
 (array['Bangalore','Hyderabad','Delhi NCR','Mumbai','Chennai','Pune','Remote'])[1+(i-1)%7],
 string_to_array(k[1+(i-1)%8],','), i%3<>0, i%4<>0
from s, h, generate_series(5,250) i;

insert into jobs(title,company,location,type) values
 ('Software Engineering Intern','Google','Bangalore','Internship'),
 ('Graduate Software Engineer','Microsoft','Hyderabad','Full-time'),
 ('Data Analyst Intern','Deloitte','Remote','Internship');
insert into settings values ('Allow new registrations',true),('Show profiles in search',true),('Maintenance mode',false);
