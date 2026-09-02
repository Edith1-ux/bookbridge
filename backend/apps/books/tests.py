from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.books.models import Book


from django.core.cache import cache


class BookAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.books_url = '/api/books/'
        self.stats_url = '/api/statistics'

        self.seller = User.objects.create_user(
            email='seller@rcti.ac.in',
            password='Password123!',
            full_name='Seller One',
            role='STUDENT'
        )

        self.other_user = User.objects.create_user(
            email='other@rcti.ac.in',
            password='Password123!',
            full_name='Other User',
            role='STUDENT'
        )

        self.admin_user = User.objects.create_user(
            email='admin@rcti.ac.in',
            password='Password123!',
            full_name='Admin Staff',
            role='SUPER_ADMIN',
            is_staff=True
        )

        self.book = Book.objects.create(
            seller=self.seller,
            title='Database Management Systems',
            author='Raghu Ramakrishnan',
            branch='CE',
            semester=4,
            price=250.00,
            original_price=450.00,
            status='Available',
            mode='sell'
        )

    def test_unauthenticated_can_list_books(self):
        res = self.client.get(self.books_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        items = data['results'] if 'results' in data else data
        self.assertGreaterEqual(len(items), 1)

    def test_unauthenticated_cannot_create_book(self):
        payload = {
            'title': 'Operating System Concepts',
            'author': 'Silberschatz',
            'branch': 'CE',
            'semester': 4,
            'price': 300.00,
            'mode': 'sell'
        }
        res = self.client.post(self.books_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_creates_book_with_auto_assigned_seller(self):
        self.client.force_authenticate(user=self.seller)
        payload = {
            'title': 'Data Structures and Algorithms',
            'author': 'Narasimha Karumanchi',
            'branch': 'IT',
            'semester': 3,
            'price': 220.00,
            'mode': 'sell'
        }
        res = self.client.post(self.books_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertEqual(data['title'], 'Data Structures and Algorithms')
        self.assertEqual(data['seller_name'], 'Seller One')

        # Verify DB object has correct seller
        created_book = Book.objects.get(id=data['id'])
        self.assertEqual(created_book.seller, self.seller)

    def test_seller_spoofing_is_prevented(self):
        self.client.force_authenticate(user=self.seller)
        payload = {
            'title': 'Computer Networks',
            'author': 'Andrew Tanenbaum',
            'branch': 'CE',
            'semester': 5,
            'price': 350.00,
            'seller': str(self.other_user.id),
            'mode': 'sell'
        }
        res = self.client.post(self.books_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()

        created_book = Book.objects.get(id=data['id'])
        self.assertEqual(created_book.seller, self.seller)
        self.assertNotEqual(created_book.seller, self.other_user)

    def test_owner_can_delete_book(self):
        self.client.force_authenticate(user=self.seller)
        res = self.client.delete(f'/api/books/{self.book.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=self.book.id).exists())

    def test_non_owner_cannot_delete_book(self):
        self.client.force_authenticate(user=self.other_user)
        res = self.client.delete(f'/api/books/{self.book.id}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Book.objects.filter(id=self.book.id).exists())

    def test_admin_can_delete_any_book(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.delete(f'/api/books/{self.book.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=self.book.id).exists())

    def test_statistics_endpoint_accurate_counts(self):
        res = self.client.get(self.stats_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['active_students'], 2)
        self.assertEqual(data['books_listed'], 1)

    def test_valid_image_upload_success(self):
        import io
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        image_io = io.BytesIO()
        image = Image.new('RGB', (100, 100), color='blue')
        image.save(image_io, format='JPEG')
        image_file = SimpleUploadedFile("cover.jpg", image_io.getvalue(), content_type="image/jpeg")

        self.client.force_authenticate(user=self.seller)
        payload = {
            'title': 'Computer Networks 6th Edition',
            'author': 'Andrew S. Tanenbaum',
            'branch': 'CE',
            'semester': 5,
            'price': 450,
            'mode': 'sell',
            'cover_image': image_file,
        }
        res = self.client.post(self.books_url, payload, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertTrue(data['cover_image'])

    def test_invalid_file_extension_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        fake_exe = SimpleUploadedFile("malicious.exe", b"binary content", content_type="application/octet-stream")
        self.client.force_authenticate(user=self.seller)
        payload = {
            'title': 'Test Book',
            'author': 'Test Author',
            'branch': 'CE',
            'semester': 1,
            'price': 100,
            'mode': 'sell',
            'cover_image': fake_exe,
        }
        res = self.client.post(self.books_url, payload, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cover_image', res.json())
