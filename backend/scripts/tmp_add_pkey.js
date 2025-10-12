const {Pool}=require('pg');require('dotenv').config({path:'.env'});
(async()=>{
  const p=new Pool({connectionString:process.env.DATABASE_URL});
  try{
    const exists = await p.query("SELECT conname FROM pg_constraint WHERE conrelid = 'public.portfolios'::regclass AND contype = 'p'");
    if (exists.rows.length>0){
      console.log('Primary key already exists:', exists.rows.map(r=>r.conname));
    } else {
      console.log('Adding primary key on portfolios(id)');
      await p.query('ALTER TABLE public.portfolios ADD PRIMARY KEY (id)');
      console.log('Primary key added');
    }
  }catch(e){console.error('Failed to add primary key:',e);process.exit(1);}finally{await p.end();}
})();
