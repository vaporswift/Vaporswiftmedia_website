# Temporary staging

This directory is **not** where Throughline should live. It is a standalone
project that belongs in its own repository (`vaporswift/throughline`), and it is
parked here only so the work survives while that repository is being created.

The full source, with its own two-commit git history, was developed at
`/home/user/throughline` in the session that produced it.

To move it to its real home:

```bash
# after creating an empty vaporswift/throughline on GitHub
git clone https://github.com/vaporswift/throughline
cp -r throughline/* /path/to/clone/     # excluding this file
cd /path/to/clone && git add -A && git commit && git push -u origin main
```

Then delete this directory from the website repository.
