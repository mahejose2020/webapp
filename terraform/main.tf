terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "username" {
  description = "Unique user name to append to the bucket name"
  type        = string
}

resource "aws_s3_bucket" "demo" {
  bucket = "demo-bucket-app-${var.username}"

  tags = {
    Name    = "demo-bucket-app-${var.username}"
    Project = "ToT"
    Owner   = var.username
  }
}

output "bucket_name" {
  value = aws_s3_bucket.demo.bucket
}