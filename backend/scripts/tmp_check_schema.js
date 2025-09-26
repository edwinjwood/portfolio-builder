const {Pool}=require('pg');require('dotenv').config({path:'.env'});
(async()=>{
  const p=new Pool({connectionString:process.env.DATABASE_URL});
  try{
    const cols=await p.query("SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_name='portfolios' ORDER BY ordinal_position");
    console.log('COLUMNS:',JSON.stringify(cols.rows,null,2));
    const constr=await p.query("SELECT tc.constraint_name, tc.constraint_type, kcu.column_name FROM information_schema.table_constraints tc LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name WHERE tc.table_name='portfolios'");
    console.log('CONSTRAINTS:',JSON.stringify(constr.rows,null,2));
  }catch(e){console.error(e);process.exit(1);}finally{await p.end();}
})();
