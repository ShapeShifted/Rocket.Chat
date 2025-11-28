#!/bin/bash
set -e

sudo apt update
sudo apt install -y build-essential python3 g++ make

yarn install