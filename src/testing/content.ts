import assert from "assert";
import { TestSuite } from ".";
import { instance } from "../instantiate";
import { commands } from "vscode";

export const ContentSuite: TestSuite = {
  name: `Content API tests`,
  tests: [
    {name: `newSQLjob`, test: async () => {
      const content = instance.getContent();
      const sql = await content?.newSQLJob();

      const resultA = await sql?.query(`values (job_name)`);
      const resultB = await sql?.query(`values (job_name)`);

      console.log({resultA, resultB});

      sql?.close();
    }},

    {name: `Test runSQL (basic select)`, test: async () => {
      const content = instance.getContent();
  
      const rows = await content?.runSQL(`select * from qiws.qcustcdt`);
      assert.notStrictEqual(rows?.length, 0);

      const firstRow = rows![0];
      assert.strictEqual(typeof firstRow[`BALDUE`], `number`);
      assert.strictEqual(typeof firstRow[`CITY`], `string`);
    }},

    {name: `Test runSQL (bad basic select)`, test: async () => {
      const content = instance.getContent();
  
      try {
        await content?.runSQL(`select from qiws.qcustcdt`);
      } catch (e: any) {
        assert.strictEqual(e.message, `Token . was not valid. Valid tokens: , FROM INTO. (42601)`);
        assert.strictEqual(e.sqlstate, `42601`);
      }
    }},

    {name: `Test runSQL (with comments)`, test: async () => {
      const content = instance.getContent();
  
      const rows = await content?.runSQL([
        `-- myselect`,
        `select *`,
        `from qiws.qcustcdt --my table`,
        `limit 1`,
      ].join(`\n`));

      assert.strictEqual(rows?.length, 1);
    }},

    {name: `Compare runSQL and old runQuery (deprecated)`, test: async () => {
      const content = instance.getContent();

      const query = [
        `-- myselect`,
        `select *`,
        `from qiws.qcustcdt --my table`,
        `limit 1`,
      ].join(`\n`);
  
      const rowsA = await content?.runSQL(query);

      const rowsB = await commands.executeCommand(`code-for-ibmi.runQuery`, query);

      assert.deepStrictEqual(rowsA, rowsB);
    }},

    {name: `Test getTable (SQL disabled)`, test: async () => {
      const config = instance.getConfig();
      const content = instance.getContent();
  
      const resetValue = config!.enableSQL;

      // SQL needs to be disabled for this test.
      config!.enableSQL = false;
      const rows = await content?.getTable(`qiws`, `qcustcdt`, `*all`);

      config!.enableSQL = resetValue;

      assert.notStrictEqual(rows?.length, 0);
      const firstRow = rows![0];

      assert.strictEqual(typeof firstRow[`BALDUE`], `number`);
      assert.strictEqual(typeof firstRow[`CITY`], `string`);
    }},

    {name: `Test getTable (SQL enabled)`, test: async () => {
      const config = instance.getConfig();
      const content = instance.getContent();
  
      assert.strictEqual(config!.enableSQL, true, `SQL must be enabled for this test`);

      const rows = await content?.getTable(`qiws`, `qcustcdt`, `qcustcdt`);

      assert.notStrictEqual(rows?.length, 0);
    }},

    {name: `Test validateLibraryList`, test: async () => {
      const content = instance.getContent();
  
      const badLibs = await content?.validateLibraryList([`QSYSINC`, `BEEPBOOP`]);

      assert.strictEqual(badLibs?.includes(`BEEPBOOP`), true);
      assert.strictEqual(badLibs?.includes(`QSYSINC`), false);
    }},

    {name: `Test getFileList`, test: async () => {
      const content = instance.getContent();
  
      const objects = await content?.getFileList(`/`);

      const qsysLib = objects?.find(obj => obj.name === `QSYS.LIB`);

      assert.strictEqual(qsysLib?.name, `QSYS.LIB`);
      assert.strictEqual(qsysLib?.path, `/QSYS.LIB/`);
      assert.strictEqual(qsysLib?.type, `directory`);
    }},

    {name: `Test getFileList`, test: async () => {
      const content = instance.getContent();
  
      const objects = await content?.getFileList(`/`);

      const qsysLib = objects?.find(obj => obj.name === `QSYS.LIB`);

      assert.strictEqual(qsysLib?.name, `QSYS.LIB`);
      assert.strictEqual(qsysLib?.path, `/QSYS.LIB/`);
      assert.strictEqual(qsysLib?.type, `directory`);
    }},

    {name: `Test getObjectList (all objects)`, test: async () => {
      const content = instance.getContent();
  
      const objects = await content?.getObjectList({library: `QSYSINC`});

      assert.notStrictEqual(objects?.length, 0);
    }},

    {name: `Test getObjectList (pgm filter)`, test: async () => {
      const content = instance.getContent();
  
      const objects = await content?.getObjectList({library: `QSYSINC`, types: [`*PGM`]});

      assert.notStrictEqual(objects?.length, 0);

      const containsNonPgms = objects?.some(obj => obj.type !== `*PGM`);

      assert.strictEqual(containsNonPgms, false);
    }},

    {name: `Test getObjectList (source files only)`, test: async () => {
      const content = instance.getContent();
  
      const objects = await content?.getObjectList({library: `QSYSINC`, types: [`*SRCPF`]});

      assert.notStrictEqual(objects?.length, 0);

      const containsNonFiles = objects?.some(obj => obj.type !== `*FILE`);

      assert.strictEqual(containsNonFiles, false);
    }},

    {name: `Test getObjectList (source files only, named filter)`, test: async () => {
      const content = instance.getContent();
  
      const objects = await content?.getObjectList({library: `QSYSINC`, types: [`*SRCPF`], object: `MIH`});

      assert.strictEqual(objects?.length, 1);

      assert.strictEqual(objects[0].type, `*FILE`);
      assert.strictEqual(objects[0].text, `DATA BASE FILE FOR C INCLUDES FOR MI`);
    }},

    {name: `getMemberList (SQL, no filter)`, test: async () => {
      const content = instance.getContent();
  
      const members = await content?.getMemberList(`qsysinc`, `mih`);

      assert.strictEqual(members?.length, 148);

      const actbpgm = members.find(mbr => mbr.name === `ACTBPGM`);

      assert.strictEqual(actbpgm?.name, `ACTBPGM`);
      assert.strictEqual(actbpgm?.extension, `C`);
      assert.strictEqual(actbpgm?.text, `ACTIVATE BOUND PROGRAM`);
      assert.strictEqual(actbpgm?.library, `QSYSINC`);
      assert.strictEqual(actbpgm?.file, `MIH`);
    }},

    {name: `getMemberList (SQL compared to nosql)`, test: async () => {
      const config = instance.getConfig();
      const content = instance.getContent();

      assert.strictEqual(config!.enableSQL, true, `SQL must be enabled for this test`);
  
      // First we fetch the members in SQL mode
      const membersA = await content?.getMemberList(`qsysinc`, `mih`);

      config!.enableSQL = false;

      // Then we fetch the members without SQL
      const membersB = await content?.getMemberList(`qsysinc`, `mih`);

      // Reset the config
      config!.enableSQL = true;

      assert.deepStrictEqual(membersA, membersB);
    }},

    {name: `getMemberList (name filter, SQL compared to nosql)`, test: async () => {
      const config = instance.getConfig();
      const content = instance.getContent();

      assert.strictEqual(config!.enableSQL, true, `SQL must be enabled for this test`);
  
      // First we fetch the members in SQL mode
      const membersA = await content?.getMemberList(`qsysinc`, `mih`, `C*`);

      config!.enableSQL = false;

      // Then we fetch the members without SQL
      const membersB = await content?.getMemberList(`qsysinc`, `mih`, `C*`);

      // Reset the config
      config!.enableSQL = true;

      assert.deepStrictEqual(membersA, membersB);
    }},
  ]
};
