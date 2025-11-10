#!/bin/bash

# Generate AUTH_SECRET for Vercel deployment
echo "Generating AUTH_SECRET..."
echo ""
SECRET=$(openssl rand -base64 32)
echo "AUTH_SECRET=\"$SECRET\""
echo ""
echo "Copy the line above to your Vercel environment variables"
