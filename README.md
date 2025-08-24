
# WebApp K8s + S3 Demo

This demo app shows:
1) Which Kubernetes pod handled the request (via `$HOSTNAME`).  
2) A simple "Add item" form (in-memory).  
3) Optional image upload to S3, controlled via an environment flag.

## Run locally

```bash
cp .env.sample .env  # then edit values
npm install
npm start
# Visit http://localhost:3000
```

## Docker

```bash
docker build -t webapp-k8s-s3-demo:latest .
docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e FEATURE_IMAGE_UPLOAD=true \
  -e AWS_REGION=us-east-1 \
  -e AWS_S3_BUCKET=your-bucket-name \
  -e AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY \
  webapp-k8s-s3-demo:latest
```

## Kubernetes (example with Ingress)

1. Push your image and update Deployment image reference.
2. Apply config + secrets (replace values first):
```bash
kubectl apply -f k8s/config-secret.yaml
kubectl apply -f k8s/deployment-service-ingress.yaml
```
3. If using Minikube:
```bash
minikube addons enable ingress
echo "$(minikube ip) webapp.local" | sudo tee -a /etc/hosts
```
4. Visit http://webapp.local

## Environment variables

- `PORT`: server port (default 3000).  
- `FEATURE_IMAGE_UPLOAD`: `true|false` to show or hide the S3 upload UI and routes.  
- `AWS_REGION`, `AWS_S3_BUCKET`: S3 configuration.  
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: for local/docker; in Kubernetes prefer IAM roles (IRSA).

## Notes

- After upload, the server returns a **temporary signed URL** (15 minutes) for viewing the object.
- In production, prefer IAM roles instead of long-lived access keys.
