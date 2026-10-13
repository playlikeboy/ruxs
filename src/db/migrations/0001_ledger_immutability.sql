-- Hand-written migration: Enforce append-only immutability on ledger_entries
CREATE OR REPLACE FUNCTION block_ledger_entries_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries is append-only. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_block_ledger_entries_mutation
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION block_ledger_entries_mutation();
